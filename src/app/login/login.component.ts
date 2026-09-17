import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jwt_decode from "jwt-decode";
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../_services/shared.service';
import { SharedHelper } from '../_Helper/SharedHelper';
import { ConfigService } from '../_services/LoadConfigFile';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  form: FormGroup;
  SendOTPform: FormGroup;
  otpVerificationFrom: FormGroup;
  resetPasswordForm: FormGroup;
  submitted: boolean = false;
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;
  showConfirmPassword: boolean = false;
  Forgotsubmitted: boolean;
  RestLoading: boolean;
  SendOTPSection: boolean;
  OtpVerificationSection: boolean;
  ConfirmPasswordSection: boolean = false;
  otpSubmitted: boolean;
  Resetsubmitted: boolean;
  sendOtpLoader: boolean = false;

  constructor(private route: Router,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      UserCode: ['', Validators.required],
      Password: ['', Validators.required],
      BackendUrl: [''],
    });

    this.SendOTPform = this.formBuilder.group({
      Email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
    });
    this.otpVerificationFrom = this.formBuilder.group({
      Email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      Digit1: [null, [Validators.required, Validators.maxLength(1)]],
      Digit2: [null, [Validators.required, Validators.maxLength(1)]],
      Digit3: [null, [Validators.required, Validators.maxLength(1)]],
      Digit4: [null, [Validators.required, Validators.maxLength(1)]],
      Digit5: [null, [Validators.required, Validators.maxLength(1)]],
      Digit6: [null, [Validators.required, Validators.maxLength(1)]],
    },
    );
    this.resetPasswordForm = this.formBuilder.group({
      Email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      NewPassword: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      ConfirmPassword: ['', [Validators.required, Validators.maxLength(50)]],
      IsReset: [false]
    },
      { validators: this._sharedHelper.passwordMatchValidator('NewPassword', 'ConfirmPassword') });
  }

  get f() { return this.form.controls; }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    let Url = '/Account/Login';
    this.loading = true;
    let BackendURL = this.configService.config['apiUrl'];
    this.form.controls['BackendUrl'].setValue(BackendURL);
    this._service.Post(this.form.value, Url).subscribe((res: any) => {
      if (res.status == 1) {
        
        localStorage.setItem('token', res.data);
        const token = localStorage.getItem('token');
        if (token) {
          var decoded: { fullName: string } = jwt_decode(token);
        }
        this.loading = false;
        this.route.navigateByUrl('/dashboard');
      }
      else {
        this.toastr.error(res.message, 'Authentication failed');
        this.loading = false;
      }
    },
      err => {
        if (err.status == 400) {
          this.toastr.error('Incorrect username or password', 'Authentication failed');
          this.loading = false;
        } else if (err.status == 0) {

          this.toastr.error("Server Not Reponding.");
          this.loading = false;
        }
      });
  }
  showForgotPasswordModal() {
    this.SendOTPSection = true;
    this.ConfirmPasswordSection = false;
    this.OtpVerificationSection = false;
    this.SendOTPform.reset();
    ($('#forgotPasswordModal') as any).modal('show');
  }
  moveToNext(event: any, nextInput: any): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length === 1 && nextInput) {
      nextInput.focus();
    }

  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.trim().replace(/\D/g, '').split('').slice(0, 6); // only digits, max 6

    if (!digits.length) return;

    const controlNames = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];

    // Fill form controls with pasted digits
    controlNames.forEach((control, index) => {
      this.otpVerificationFrom.get(control)?.setValue(digits[index] || '');
    });

    // Focus the next empty input (or last one if all filled)
    const nextIndex = digits.length < 6 ? digits.length : 5;
    const nextInput = document.getElementById(`d${nextIndex + 1}`) as HTMLElement;
    if (nextInput) nextInput.focus();
  }

  get SendOTP() { return this.SendOTPform.controls; }
  SendOTPFormSubmit() {

    this.Forgotsubmitted = true;
    if (this.SendOTPform.invalid) {
      return;
    }
    let Url = '/Account/ForgotPassword';

    this.RestLoading = true;
    this.sendOtpLoader = true;
    this._service.Post(this.SendOTPform.value, Url).subscribe((res: any) => {
      this.sendOtpLoader = false;
      if (res.status) {
        this.toastr.success(res.message, 'Success');
        this.SendOTPSection = false;
        this.OtpVerificationSection = true;
        this.ConfirmPasswordSection = false;

        this.otpVerificationFrom.get('Email')?.setValue(this.SendOTPform.get('Email')?.value);
        this.Forgotsubmitted = false;
      } else {
        this.toastr.error(res.message, 'Error');

      }
      this.RestLoading = false;
    },
      err => {
        this.RestLoading = false;
        if (err.status == 400) {
          this.toastr.error(err.error.message, 'Error');
          this.loading = false;
        } else if (err.status == 0) {
          this.toastr.error("Server Not Responding.");
          this.loading = false;
        }
      });
  }
  get otp() { return this.otpVerificationFrom.controls; }
  VerifyOtp() {
    

    this.otpSubmitted = true;
    if (this.otpVerificationFrom.invalid) {

      return;
    }
    const otp = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6']
      .map(key => this.otpVerificationFrom.value[key])
      .join('');
    let data = {
      Email: this.otpVerificationFrom.get('Email')?.value,
      Otp: otp,
    };
    let Url = '/Account/ResetPassword';
    this.RestLoading = true;

    this._service.Post(data, Url).subscribe((res: any) => {
      if (res.status) {

        this.SendOTPSection = false;
        this.OtpVerificationSection = false;
        this.ConfirmPasswordSection = true;

        this.toastr.success(res.message, 'Success');
        this.loading = false;
        this.resetPasswordForm.get('Email')?.setValue(this.otpVerificationFrom.get('Email')?.value);
        this.otpVerificationFrom.reset();
        this.otpSubmitted = false;
      } else {
        this.toastr.error(res.message, 'Error');
        this.loading = false;
      }
      this.RestLoading = false;
    },
      err => {
        this.RestLoading = false;
        if (err.status == 400) {
          this.toastr.error(err.error.message, 'Error');
          this.loading = false;
        } else if (err.status == 0) {
          this.toastr.error("Server Not Responding.");
          this.loading = false;
        }
      });
  }
  get reset() { return this.resetPasswordForm.controls; }

  ResetPassword() {
    
    this.Resetsubmitted = true;
    if (this.resetPasswordForm.invalid) {
      return;
    }

    let data = {
      Email: this.resetPasswordForm.get('Email')?.value, //this.forgotPasswordEMail,
      NewPassword: this.resetPasswordForm.get('NewPassword')?.value,
    };
    let Url = '/Account/ResetPassword';
    this.RestLoading = true;

    this._service.Post(data, Url).subscribe((res: any) => {
      if (res.status) {
        this.loading = false;
        ($('#forgotPasswordModal') as any).modal('hide');
        this.toastr.success("Password Reset Successfully!", "Success")
        this.resetPasswordForm.reset();
        this.Resetsubmitted = false;
      } else {
        this.toastr.error(res.message, 'Error');
        this.loading = false;
      }
      this.RestLoading = false;
    },
      err => {
        this.RestLoading = false;
        if (err.status == 400) {
          this.toastr.error(err.error.message, 'Error');
          this.loading = false;
        } else if (err.status == 0) {
          this.toastr.error("Server Not Responding.");
          this.loading = false;
        }
      });
  }
}
