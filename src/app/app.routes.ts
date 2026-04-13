import { Routes } from '@angular/router';
import { LoginComponent } from './Login/login.component';
import { SignupComponent } from './Signup/signup.component';
import { ForgotpasswordComponent } from './ForgotPassword/forgotpassword.component';
import { HomeComponent } from './Home/home.component';
import { NotificationComponent } from './notification/notification.component';
import { SettingsComponent } from './settings/settings.component';
import { BookComponent } from './Booking/book.component';
import { HomeAdminComponent } from './HomeAdmin/homeadmin.component';
import { NotificationAdminComponent } from './NotificationAdmin/notificationadmin.component';
import { SettingsadminComponent } from './SettingsAdmin/settingsadmin.component';
import { ListComponent } from './ListAdmin/list.component';
import { ProfileComponent } from './Profile/profile.component';
import { AdprofileComponent } from './AdminProfile/Adprofile.component';
import { DashboardComponent } from './Dashboard/dasboard.component';

export const routes: Routes = [
    {path: 'login', component:LoginComponent },
    {path: 'signup', component:SignupComponent},
    {path: 'forgotpassword', component:ForgotpasswordComponent},
    {path: 'home', component:HomeComponent},
    {path: 'notification', component: NotificationComponent },
    {path: 'settings', component: SettingsComponent},
    {path: 'book', component: BookComponent},
    {path: 'adhome', component: HomeAdminComponent},
    {path: 'adnot', component: NotificationAdminComponent},
    {path: 'settingsadmin', component: SettingsadminComponent},
    {path: 'list', component: ListComponent},
    {path: 'profile', component: ProfileComponent},
    {path: 'adprofile', component: AdprofileComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: '', redirectTo: '/login', pathMatch: 'full'}
];
