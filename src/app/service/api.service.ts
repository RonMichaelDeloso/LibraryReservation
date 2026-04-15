import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class apiService {
    private http = inject(HttpClient);
    private API_URL = 'http://127.0.0.1:3000/api';

    public async getAllUsers() {
        try {
            return await lastValueFrom(this.http.get<any[]>(`${this.API_URL}/auth/users`));
        } catch (e) {
            console.error('Failed to fetch users', e);
            return [];
        }
    }
}