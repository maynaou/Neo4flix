import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageState = signal('');
  readonly message = this.messageState.asReadonly();
  private timer?: ReturnType<typeof setTimeout>;
  show(message: string): void {
    clearTimeout(this.timer);
    this.messageState.set(message);
    this.timer = setTimeout(() => this.messageState.set(''), 4500);
  }
  dismiss(): void {
    clearTimeout(this.timer);
    this.messageState.set('');
  }
}
