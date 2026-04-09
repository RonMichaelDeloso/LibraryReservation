import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { last, lastValueFrom } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class ReservationService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/api/reservations';

    public async getAllReservation() {
        return lastValueFrom(
            this.http.get<any[]>(this.apiUrl)
        );
    }

    public async getReservationsByStudent(id: number) {
        return lastValueFrom(
            this.http.get<any[]>(`${this.apiUrl}/student/${id}`)
        );
    }

    public async createReservation(data: {
        Student_id: number;
        Book_id: number;
        Reserve_date: string
        Due_date: string;
    }) {
        return lastValueFrom(
            this.http.post<any>(this.apiUrl, data)
        );
    }

    public async approveReservation(id: number) {
        return lastValueFrom(
            this.http.put<any>(`${this.apiUrl}/cancel/${id}`, {})
        );
    }
}
