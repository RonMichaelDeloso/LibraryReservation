import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:3000/api/notifications';

    public async getByUser(userId: number) {
        return lastValueFrom(
            this.http.get<any[]>(`${this.apiUrl}/user/${userId}`)
        );
    }

    public async markAsRead(notificationId: number) {
        return lastValueFrom(
            this.http.put<any>(`${this.apiUrl}/read/${notificationId}`, {})
        );
    }

    public async markAllAsRead(userId: number) {
        return lastValueFrom(
            this.http.put<any>(`${this.apiUrl}/read-all/${userId}`, {})
        );
    }

    public async deleteNotification(notificationId: number) {
        return lastValueFrom(
            this.http.delete<any>(`${this.apiUrl}/${notificationId}`)
        );
    }

    public async deleteAll(userId: number) {
        return lastValueFrom(
            this.http.delete<any>(`${this.apiUrl}/all/${userId}`)
        );
    }
}
