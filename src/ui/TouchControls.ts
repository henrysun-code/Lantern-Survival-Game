export type MoveDirection = { x: number; y: number };

export class TouchControls {
  private root = document.createElement('div');
  private joystick = document.createElement('div');
  private thumb = document.createElement('div');
  private direction: MoveDirection = { x: 0, y: 0 };
  private pointerId: number | null = null;

  constructor(onSettings: () => void) {
    this.root.className = 'touch-controls';
    this.joystick.className = 'touch-joystick';
    this.joystick.setAttribute('role', 'group');
    this.joystick.setAttribute('aria-label', '移動搖桿');
    this.thumb.className = 'touch-joystick-thumb';
    this.joystick.append(this.thumb);
    const settings = document.createElement('button');
    settings.className = 'touch-settings';
    settings.type = 'button';
    settings.textContent = '調整';
    settings.setAttribute('aria-label', '開啟或關閉遊戲調整面板');
    settings.addEventListener('click', onSettings);
    this.root.append(this.joystick, settings);
    document.body.append(this.root);
    this.joystick.addEventListener('pointerdown', this.onPointerDown);
    this.joystick.addEventListener('pointermove', this.onPointerMove);
    this.joystick.addEventListener('pointerup', this.onPointerEnd);
    this.joystick.addEventListener('pointercancel', this.onPointerEnd);
    this.joystick.addEventListener('lostpointercapture', this.onPointerEnd);
  }

  getDirection(): MoveDirection {
    return this.direction;
  }

  destroy(): void {
    this.root.remove();
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.joystick.setPointerCapture(event.pointerId);
    this.updateDirection(event);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.updateDirection(event);
  };

  private onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.direction = { x: 0, y: 0 };
    this.thumb.style.transform = 'translate(-50%, -50%)';
  };

  private updateDirection(event: PointerEvent): void {
    const rect = this.joystick.getBoundingClientRect();
    const radius = rect.width * 0.34;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    const strength = Math.min(length / radius, 1);
    const deadZone = 0.12;
    this.direction = length && strength > deadZone
      ? { x: (dx / length) * strength, y: (dy / length) * strength }
      : { x: 0, y: 0 };
    const offsetX = length ? (dx / length) * Math.min(length, radius) : 0;
    const offsetY = length ? (dy / length) * Math.min(length, radius) : 0;
    this.thumb.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }
}
