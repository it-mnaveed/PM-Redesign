import { Injectable } from '@angular/core';
import { Config } from 'protractor';
import * as CryptoJS from 'crypto-js';
import jwt_decode from "jwt-decode";
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SharedHelper {
  config: Config;
  datePickerConfig: Partial<BsDatepickerConfig>;
  constructor(
    private datePipe: DatePipe,
    private route: Router
  ) {

  }
  encryptData(data: any): string {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), 'asdfghy21212jklkdas').toString();
    } catch (e) {
      return "";

    }
  }
  getDateConfiguration() {
    const today = new Date();
    this.datePickerConfig = {
      dateInputFormat: 'DD-MM-YYYY',
      isAnimated: true,
      containerClass: 'theme-green', // optional if you're using themed styles,
    };
    return this.datePickerConfig;
  }
  getFloat(value: any, defaultValue: any) {
    const num = parseFloat(value);
    var val = isNaN(num) ? defaultValue : num;
    return val;
  }
  getGenericFormate() {
    let data = {
      DateFormate: 'dd-MM-yyyy',
      DecimelPoint: 2
    }
    return data;
  }
  getCurrentUserInfo() {
    let token = localStorage.getItem('token');
    if (token) {
      let decoded: { Id: number, UserCode: string, FullName: string, RoleName: string, RoleID: number, UserImage: string } = jwt_decode(token);
      // this.Us_PunchingLevel = decoded.PunchingLevel;
      // this.Current_UserId = decoded.Id
      return decoded;
    } else {
      return "";
    }
  }
  passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordKey)?.value;
      const confirmPassword = formGroup.get(confirmPasswordKey)?.value;

      if (password !== confirmPassword) {
        formGroup.get(confirmPasswordKey)?.setErrors({ passwordMismatch: true });
      } else {
        formGroup.get(confirmPasswordKey)?.setErrors(null);
      }

      return null;
    };
  }
  decryptData(data: any) {

    try {
      const bytes = CryptoJS.AES.decrypt(data, 'asdfghy21212jklkdas');
      if (bytes.toString()) {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      }
      return data;
    } catch (e) {

    }
  }
  formatBootstrapDateOnlyOld(value: any): string | null {
    if (!value) return null;             // covers null, undefined, ''
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null; // invalid date

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // month is 0-based
    const day = String(d.getDate()).padStart(2, '0');

    return this.datePipe.transform(d, 'yyyy-MM-dd');
    //return `${year}-${month}-${day}`;
  }

  formatBootstrapDateOnly(value: any): string | null {
    if (!value) return null;

    let d: Date;

    // ✅ Explicitly parse if format is dd-MM-yyyy
    if (typeof value === 'string' && value.includes('-')) {
      const [day, month, year] = value.split('-').map(Number);
      d = new Date(year, month - 1, day); // month is 0-based
    } else {
      d = value instanceof Date ? value : new Date(value);
    }

    if (isNaN(d.getTime())) return null;

    // ✅ Ensure backend-friendly format yyyy-MM-dd
    return this.datePipe.transform(d, 'yyyy-MM-dd');
  }

  preview(files: FileList, requiredFile: string): Promise<string> {

    return new Promise((resolve, reject) => {
      if (!files || files.length === 0) {
        return resolve(''); // No file selected
      }
      
      const file = files[0];
      const mimeType = file.type;
      const fileSize = file.size / 1000;
      const fileName = file.name.toLowerCase();
      if (requiredFile === 'image' || requiredFile === '') {
        if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'application/pdf') {
          return resolve('');
        }
      } else if (requiredFile === 'rpt') {
        if (!fileName.endsWith('.rpt')) {
          return resolve(''); // Invalid RPT type
        }
      }


      // if (requiredFile === 'image') {
      //   if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      //     return resolve(''); // Invalid type
      //   }
      // } else if (requiredFile === 'pdf') {
      //   if (mimeType !== 'application/pdf') {
      //     return resolve(''); // Invalid PDF type
      //   }
      // } else if (requiredFile === 'rpt') {

      //   if (!fileName.endsWith('.rpt')) {
      //     return resolve(''); // Invalid RPT type
      //   }
      // }

      if (fileSize >= 10240) {
        return resolve(''); // Too large
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result as string); // ✅ Return base64
      };

      reader.onerror = () => {
        reject('Failed to read file');
      };
    });
  }
  findInvalidControls(form: FormGroup) {
    const invalid: any = [];
    const controls = form.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }
  onLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('key');
    this.route.navigate(['/login']);

  }
}