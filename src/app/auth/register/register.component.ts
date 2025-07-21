import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { ContactDataService } from '../../main-pages/shared-data/contact-data.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  // #region Properties
  userName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  confirmprivacyPolicy: boolean = false;
  errorMessage: string = ''; 
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;
  passwordInput: boolean = false;
  passwordInputConfirm: boolean = false;
  confirmPrivacyPolicy: boolean = false;
  manualChange: boolean = false;
  passwordDontMatch: boolean = false;
  // #endregion

  constructor(private authenticationService: AuthenticationService, 
    private router: Router,
    private contactDataService : ContactDataService
  ) {}

  // #region Auth Methods
  async onSignUp() {
    if(this.confirmPassword === this.password){
      try {
        await this.authenticationService.signUp(this.email, this.password);
        await this.authenticationService.updateUserDisplayName(this.userName);
        await this.contactDataService.addContact(
          {
            name: this.userName,
            email: this.email,
            phone: "",
          }
        ); 
         setTimeout(() => {
          this.router.navigateByUrl('/auth/login');
        }, 4000);       
         // Sobald vorhanden zu Summary navigieren
        this.errorMessage = "🎉 Signup successful!"
        this.clearError();
        this.contactDataService.signUpButtonVisible = true;
        this.passwordDontMatch = false;
      } catch (error) {
        this.errorMessage = (error as Error).message;
        this.clearError();
        this.passwordDontMatch = false;
      }
    }else{
      this.passwordDontMatch = true;
    }
  }
  // #endregion

  togglePasswordVisibility(input: 'showPassword' | 'showPasswordConfirm', inputElement: HTMLInputElement){
    if(input == 'showPassword'){
      this.showPassword = !this.showPassword;
      inputElement.focus();
    }if(input == 'showPasswordConfirm')
      this.showPasswordConfirm = !this.showPasswordConfirm;
      inputElement.focus();
  }

  onLinkHover(hovering: boolean) {
    if (!this.manualChange) {
      this.confirmprivacyPolicy = hovering;
    }
  }

  togleManualChange(){
    this.manualChange =!this.manualChange;
  }

  goBackToLogin(){
    this.router.navigateByUrl('/auth/login');
    this.contactDataService.signUpButtonVisible = true;
  }

  clearError(){
    setTimeout(() => {
      this.errorMessage = "";
    }, 4000);
  }
}
