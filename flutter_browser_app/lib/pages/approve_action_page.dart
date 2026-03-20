import 'package:flutter/material.dart';
import '../sync_service.dart';

class ApproveActionPage extends StatelessWidget {
  final Map<String, dynamic> arguments;

  const ApproveActionPage({super.key, required this.arguments});

  @override
  Widget build(BuildContext context) {
    final String data = arguments['data'] ?? '';
    final Uri uri = Uri.parse(data);
    final String pin = uri.queryParameters['pin'] ?? '';
    final String id = uri.queryParameters['id'] ?? '';

    final bool isConnected = SyncService().getConnectionInfo()['isConnected'];

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Action Verification', style: TextStyle(fontFamily: 'Outfit')),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.security, size: 80, color: Color(0xFF00E5FF)),
              const SizedBox(height: 24),
              const Text(
                'High-Risk Action Approval',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              if (!isConnected)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Text(
                    'You are not currently connected to any Desktop. Please connect first from the home screen.',
                    style: TextStyle(color: Colors.redAccent, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                )
              else ...[
                const Text(
                  'Does this PIN match the one displayed on your Desktop screen?',
                  style: TextStyle(fontSize: 16, color: Colors.white70),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Text(
                    pin,
                    style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, letterSpacing: 8, color: Colors.white, fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: 48),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        foregroundColor: Colors.redAccent,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        side: const BorderSide(color: Colors.redAccent),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      child: const Text('REJECT'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00E5FF),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      ),
                      onPressed: () async {
                        try {
                          await SyncService().executeOnDesktop('approve-high-risk', args: {
                            'pin': pin,
                            'id': id,
                          });
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action approved successfully!')));
                            Navigator.pop(context);
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error approving action: $e')));
                          }
                        }
                      },
                      child: const Text('APPROVE'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
