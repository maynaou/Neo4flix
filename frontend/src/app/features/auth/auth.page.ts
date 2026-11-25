import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageMotionDirective, ScrollRevealDirective } from '../../shared/motion.directives';

type Field = 'identifier' | 'username' | 'email' | 'password';

@Component({
  selector: 'nfx-auth-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IconComponent,
    PageMotionDirective,
    ScrollRevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.css',
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isRegister = toSignal(this.route.data.pipe(map((data) => data['mode'] === 'register')), {
    initialValue: false,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly registered = computed(() => this.queryParams()?.get('inscrit') === '1');
  readonly form = inject(FormBuilder).nonNullable.group({
    identifier: [''],
    username: [''],
    email: [''],
    password: [''],
  });
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal('');
  readonly toggle = (value: boolean) => !value;
  @ViewChild('errorSummary') private errorSummary?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const register = this.isRegister();
      this.form.reset();
      this.submitted.set(false);
      this.error.set('');
      this.showPassword.set(false);
      this.form.controls.identifier.setValidators(register ? [] : [Validators.required]);
      this.form.controls.username.setValidators(
        register
          ? [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(20),
              Validators.pattern(/^\w+$/),
            ]
          : [],
      );
      this.form.controls.email.setValidators(
        register ? [Validators.required, Validators.email] : [],
      );
      this.form.controls.password.setValidators(
        register ? [Validators.required, Validators.minLength(8)] : [Validators.required],
      );
      Object.values(this.form.controls).forEach((control) => control.updateValueAndValidity());
    });
  }

  fields(): Field[] {
    return this.isRegister() ? ['username', 'email', 'password'] : ['identifier', 'password'];
  }
  invalidFields(): Field[] {
    return this.fields().filter((field) => this.hasError(field));
  }
  hasError(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }
  fieldError(field: Field): string {
    const errors = this.form.controls[field].errors;
    if (!errors) return '';
    if (errors['server']) return String(errors['server']);
    if (errors['required'])
      return {
        username: 'Choisissez un nom d’utilisateur.',
        email: 'Indiquez votre adresse email.',
        identifier: 'Indiquez votre email ou nom d’utilisateur.',
        password: 'Indiquez votre mot de passe.',
      }[field];
    if (field === 'email') return 'Indiquez une adresse email valide.';
    if (field === 'password') return 'Le mot de passe doit contenir au moins 8 caractères.';
    return 'Le nom doit contenir 3 à 20 lettres, chiffres ou underscores.';
  }

  submit(): void {
    if (this.pending()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) {
      this.focusErrors();
      return;
    }
    this.pending.set(true);
    const register = this.isRegister();
    this.createAuthenticationRequest(register)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleAuthenticationSuccess(register),
        error: (error: unknown) => this.handleAuthenticationFailure(error),
      });
  }

  private createAuthenticationRequest(register: boolean): Observable<void> {
    const values = this.form.getRawValue();
    if (!register) return this.auth.login(values.identifier.trim(), values.password);
    return this.auth.register({
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
    });
  }

  private handleAuthenticationSuccess(register: boolean): void {
    this.pending.set(false);
    if (register) {
      void this.router.navigate(['/connexion'], { queryParams: { inscrit: 1 } });
      return;
    }
    this.toast.show('Bienvenue dans votre univers Neo4flix.');
    void this.router.navigate(['/']);
  }

  private handleAuthenticationFailure(error: unknown): void {
    this.pending.set(false);
    this.error.set(this.requestErrorMessage(error));
    if (error instanceof HttpErrorResponse && error.status === 400) {
      this.applyServerFieldErrors(error.error);
    }
    this.focusErrors();
  }

  private requestErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          return 'Email, nom d’utilisateur ou mot de passe incorrect. Vérifiez vos informations.';
        case 409:
          return 'Ce nom d’utilisateur ou cette adresse email est déjà utilisé.';
        case 400:
          return 'Vérifiez les informations de votre formulaire.';
      }
    }
    return 'La connexion est momentanément indisponible. Réessayez dans un instant.';
  }

  private applyServerFieldErrors(response: unknown): void {
    if (!response || typeof response !== 'object') return;
    const errors = response as Record<string, unknown>;
    for (const field of this.fields()) {
      if (typeof errors[field] !== 'string') continue;
      this.form.controls[field].setErrors({ server: this.fieldErrorForServer(field) });
    }
  }

  private fieldErrorForServer(field: Field): string {
    return field === 'email'
      ? 'Vérifiez votre adresse email.'
      : field === 'password'
        ? 'Le mot de passe doit contenir au moins 8 caractères.'
        : 'Vérifiez le nom d’utilisateur : 3 à 20 lettres, chiffres ou underscores.';
  }
  private focusErrors(): void {
    setTimeout(() => this.errorSummary?.nativeElement.focus(), 0);
  }
}
