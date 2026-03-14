import { Routes } from '@angular/router';
import { LoginComponent } from './Login/login.component';
import { SignupComponent } from './Signup/signup.component';
import { ForgotpasswordComponent } from './ForgotPassword/forgotpassword.component';
import { HomeComponent } from './Home/home.component';
import { NotificationComponent } from './notification/notification.component';
import { SettingsComponent } from './settings/settings.component';
import { BookComponent } from './Booking/book.component';

export const routes: Routes = [
    {path: 'login', component:LoginComponent },
    {path: 'signup', component:SignupComponent},
    {path: 'forgotpassword', component:ForgotpasswordComponent},
    {path: 'home', component:HomeComponent},
    {path: 'notification', component: NotificationComponent },
    {path: 'settings', component: SettingsComponent},
    {path: 'book', component: BookComponent},
    {path: '', redirectTo: '/login', pathMatch: 'full'}
];
