const { ipcRenderer } = require('electron');

const createAuthTitle = () => {
  const title = document.createElement('div');
  title.id = 'comet-auth-title';
  title.textContent = 'Sign in to Comet-AI';
  Object.assign(title.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    zIndex: '10000000',
    pointerEvents: 'none',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  });
  return title;
};

const createTrafficLights = () => {
  const wrapper = document.createElement('div');
  wrapper.id = 'comet-auth-traffic';
  Object.assign(wrapper.style, {
    position: 'fixed',
    top: '10px',
    left: '18px',
    display: 'flex',
    gap: '6px',
    zIndex: '10000000',
    pointerEvents: 'none',
  });

  const colors = [
    { color: '#ff605c', action: 'close' },
    { color: '#ffbd44', action: 'minimize' },
    { color: '#00ca4e', action: 'zoom' },
  ];

  colors.forEach(({ color, action }) => {
    const btn = document.createElement('button');
    btn.className = 'comet-traffic-light';
    btn.dataset.action = action;
    btn.title = action.charAt(0).toUpperCase() + action.slice(1);
    Object.assign(btn.style, {
      width: '12px',
      height: '12px',
      borderRadius: '999px',
      border: 'none',
      background: color,
      outline: 'none',
      cursor: action === 'close' ? 'pointer' : 'default',
      pointerEvents: action === 'close' ? 'auto' : 'none',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.12) inset',
    });
    wrapper.appendChild(btn);
  });

  return wrapper;
};

const createDragOverlay = () => {
  const overlay = document.createElement('div');
  overlay.id = 'comet-auth-drag';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    height: '44px',
    WebkitAppRegion: 'drag',
    pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(5,5,10,0.8), transparent)',
    zIndex: '9999999',
  });
  return overlay;
};

  window.addEventListener('DOMContentLoaded', () => {
    const body = document.body || document.documentElement;
    if (!body) return;

    if (!document.getElementById('comet-auth-drag')) {
      body.appendChild(createDragOverlay());
    }

    if (!document.getElementById('comet-auth-traffic')) {
      const traffic = createTrafficLights();
      body.appendChild(traffic);
    }

    if (!document.getElementById('comet-auth-title')) {
      const title = createAuthTitle();
      body.appendChild(title);
    }

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      ipcRenderer.send('close-auth-window');
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target && event.target.dataset && event.target.dataset.action === 'close') {
      ipcRenderer.send('close-auth-window');
    }
  });
});
