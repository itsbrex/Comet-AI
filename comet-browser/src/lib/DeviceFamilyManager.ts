import { EventEmitter } from 'events';
import { cloudSyncService } from './CloudSyncService';
import { Database, ref, onValue, set, get, update, remove } from 'firebase/database';

export interface FamilyDevice {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile';
    platform: string;
    lastSeen: number;
    isOnline: boolean;
    autoConnect: boolean;
    trustLevel: 'trusted' | 'ask_once' | 'blocked';
    connectionType: 'local' | 'cloud' | 'none';
    ip?: string;
    port?: number;
}

export interface DeviceFamily {
    familyId: string;
    name: string;
    ownerId: string;
    devices: Map<string, FamilyDevice>;
    createdAt: number;
    updatedAt: number;
}

export class DeviceFamilyManager extends EventEmitter {
    private static instance: DeviceFamilyManager;
    private currentFamily: DeviceFamily | null = null;
    private localDevices: Map<string, FamilyDevice> = new Map();
    private cloudDevices: Map<string, FamilyDevice> = new Map();
    private db: Database | null = null;
    private userId: string | null = null;
    private currentDeviceId: string = '';
    private unsubscribers: (() => void)[] = [];
    private autoReconnectTimer: NodeJS.Timeout | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): DeviceFamilyManager {
        if (!DeviceFamilyManager.instance) {
            DeviceFamilyManager.instance = new DeviceFamilyManager();
        }
        return DeviceFamilyManager.instance;
    }

    public initialize(deviceId: string, deviceName: string, deviceType: 'desktop' | 'mobile', platform: string): void {
        this.currentDeviceId = deviceId;
        
        const localDevice: FamilyDevice = {
            deviceId,
            deviceName,
            deviceType,
            platform,
            lastSeen: Date.now(),
            isOnline: true,
            autoConnect: true,
            trustLevel: 'trusted',
            connectionType: 'local'
        };

        this.localDevices.set(deviceId, localDevice);
        this._loadSavedDevices();
        
        console.log(`[DeviceFamily] Initialized: ${deviceName} (${deviceId})`);
    }

    public setDatabase(db: Database): void {
        this.db = db;
    }

    public setUserId(userId: string): void {
        this.userId = userId;
        this._startCloudSync();
    }

    public getCurrentDevice(): FamilyDevice | undefined {
        return this.localDevices.get(this.currentDeviceId);
    }

    public getAllDevices(): FamilyDevice[] {
        return [
            ...Array.from(this.localDevices.values()),
            ...Array.from(this.cloudDevices.values())
        ];
    }

    public getOnlineDevices(): FamilyDevice[] {
        return this.getAllDevices().filter(d => d.isOnline);
    }

    public getDesktops(): FamilyDevice[] {
        return this.getAllDevices().filter(d => d.deviceType === 'desktop');
    }

    public getMobiles(): FamilyDevice[] {
        return this.getAllDevices().filter(d => d.deviceType === 'mobile');
    }

    public getTrustedDevices(): FamilyDevice[] {
        return this.getAllDevices().filter(d => d.trustLevel === 'trusted');
    }

    public async addDevice(device: FamilyDevice): Promise<void> {
        const existingDevice = this.cloudDevices.get(device.deviceId);
        
        if (existingDevice) {
            this.cloudDevices.set(device.deviceId, {
                ...existingDevice,
                ...device,
                lastSeen: Date.now()
            });
        } else {
            this.cloudDevices.set(device.deviceId, device);
        }

        await this._saveDeviceToCloud(device);
        this._saveDevicesLocally();
        this.emit('device-added', device);
    }

    public async removeDevice(deviceId: string): Promise<void> {
        if (deviceId === this.currentDeviceId) {
            console.warn('[DeviceFamily] Cannot remove current device');
            return;
        }

        this.cloudDevices.delete(deviceId);
        
        if (this.db && this.userId) {
            const deviceRef = ref(this.db, `families/${this.userId}/devices/${deviceId}`);
            await remove(deviceRef);
        }

        this._saveDevicesLocally();
        this.emit('device-removed', deviceId);
    }

    public async updateDeviceTrustLevel(deviceId: string, trustLevel: 'trusted' | 'ask_once' | 'blocked'): Promise<void> {
        const device = this.cloudDevices.get(deviceId);
        if (device) {
            device.trustLevel = trustLevel;
            this.cloudDevices.set(deviceId, device);
            await this._saveDeviceToCloud(device);
            this._saveDevicesLocally();
            this.emit('device-updated', device);
        }
    }

    public async setAutoConnect(deviceId: string, autoConnect: boolean): Promise<void> {
        const device = this.cloudDevices.get(deviceId);
        if (device) {
            device.autoConnect = autoConnect;
            this.cloudDevices.set(deviceId, device);
            await this._saveDeviceToCloud(device);
            this._saveDevicesLocally();
        }
    }

    public async updateDeviceOnlineStatus(deviceId: string, isOnline: boolean): Promise<void> {
        const device = this.cloudDevices.get(deviceId);
        if (device) {
            device.isOnline = isOnline;
            device.lastSeen = Date.now();
            this.cloudDevices.set(deviceId, device);
            this.emit('device-status-changed', { deviceId, isOnline });

            if (isOnline && device.autoConnect && device.trustLevel === 'trusted') {
                await this._autoConnectDevice(deviceId);
            }
        }
    }

    private async _autoConnectDevice(deviceId: string): Promise<void> {
        console.log(`[DeviceFamily] Auto-connecting to device: ${deviceId}`);
        this.emit('auto-connecting', deviceId);
        
        try {
            await cloudSyncService.connectToDevice(deviceId);
            console.log(`[DeviceFamily] Auto-connected to: ${deviceId}`);
        } catch (error) {
            console.error(`[DeviceFamily] Auto-connect failed:`, error);
        }
    }

    private _startCloudSync(): void {
        if (!this.db || !this.userId) return;

        const familyRef = ref(this.db, `families/${this.userId}`);
        const unsubscribe = onValue(familyRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && data.devices) {
                Object.entries(data.devices).forEach(([id, device]: [string, any]) => {
                    if (id !== this.currentDeviceId) {
                        const familyDevice: FamilyDevice = {
                            deviceId: id,
                            deviceName: device.deviceName,
                            deviceType: device.deviceType,
                            platform: device.platform,
                            lastSeen: device.lastSeen || Date.now(),
                            isOnline: device.isOnline || false,
                            autoConnect: device.autoConnect !== false,
                            trustLevel: device.trustLevel || 'ask_once',
                            connectionType: 'cloud'
                        };
                        
                        const existing = this.cloudDevices.get(id);
                        if (!existing || existing.isOnline !== familyDevice.isOnline) {
                            this.cloudDevices.set(id, familyDevice);
                            this.emit('device-updated', familyDevice);
                        }
                    }
                });
            }
        });

        this.unsubscribers.push(unsubscribe);
    }

    private async _saveDeviceToCloud(device: FamilyDevice): Promise<void> {
        if (!this.db || !this.userId) return;

        const deviceRef = ref(this.db, `families/${this.userId}/devices/${device.deviceId}`);
        await set(deviceRef, device);
    }

    private _loadSavedDevices(): void {
        try {
            const saved = localStorage.getItem('comet-device-family');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.entries(parsed).forEach(([id, device]: [string, any]) => {
                    if (id !== this.currentDeviceId) {
                        this.localDevices.set(id, device);
                    }
                });
            }
        } catch (error) {
            console.error('[DeviceFamily] Failed to load saved devices:', error);
        }
    }

    private _saveDevicesLocally(): void {
        try {
            const devicesToSave: Record<string, FamilyDevice> = {};
            this.cloudDevices.forEach((device, id) => {
                devicesToSave[id] = device;
            });
            localStorage.setItem('comet-device-family', JSON.stringify(devicesToSave));
        } catch (error) {
            console.error('[DeviceFamily] Failed to save devices locally:', error);
        }
    }

    public async renameDevice(deviceId: string, newName: string): Promise<void> {
        const device = this.cloudDevices.get(deviceId) || this.localDevices.get(deviceId);
        if (device) {
            device.deviceName = newName;
            this.cloudDevices.set(deviceId, device);
            await this._saveDeviceToCloud(device);
            this._saveDevicesLocally();
            this.emit('device-renamed', { deviceId, newName });
        }
    }

    public async requestConnection(deviceId: string): Promise<boolean> {
        const device = this.cloudDevices.get(deviceId);
        if (!device) return false;

        if (device.trustLevel === 'blocked') {
            return false;
        }

        if (device.trustLevel === 'trusted' || device.autoConnect) {
            return cloudSyncService.connectToDevice(deviceId);
        }

        return false;
    }

    public async approveDevice(deviceId: string): Promise<void> {
        await this.updateDeviceTrustLevel(deviceId, 'trusted');
        await cloudSyncService.connectToDevice(deviceId);
    }

    public async rejectDevice(deviceId: string): Promise<void> {
        await this.updateDeviceTrustLevel(deviceId, 'blocked');
    }

    public startAutoReconnect(intervalMs: number = 30000): void {
        this.stopAutoReconnect();
        
        this.autoReconnectTimer = setInterval(() => {
            const trustedDevices = this.getAllDevices().filter(
                d => d.autoConnect && d.trustLevel === 'trusted' && !d.isOnline
            );
            
            trustedDevices.forEach(device => {
                this._autoConnectDevice(device.deviceId);
            });
        }, intervalMs);
    }

    public stopAutoReconnect(): void {
        if (this.autoReconnectTimer) {
            clearInterval(this.autoReconnectTimer);
            this.autoReconnectTimer = null;
        }
    }

    public cleanup(): void {
        this.stopAutoReconnect();
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}

export const deviceFamilyManager = DeviceFamilyManager.getInstance();
