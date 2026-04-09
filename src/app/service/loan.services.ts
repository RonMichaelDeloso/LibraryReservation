import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class LoanService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/api/loans';

    public async getAllLoans() {
        return lastValueFrom(
            this.http.get<any[]>(this.apiUrl)
        );
    }

    public async getLoansByUser(id: number) {  // Changed from getLoansByStudent
        return lastValueFrom(
            this.http.get<any[]>(`${this.apiUrl}/user/${id}`)  // Changed from /student/ to /user/
        );
    }

    public async createLoan(data: {
        User_id: number;  // Changed from Student_id to User_id
        Book_id: number;  // Changed from book_id to Book_id (consistent with backend)
        Borrow_date: string;
        Due_date: string;
    }) {
       return lastValueFrom(
        this.http.post<any>(this.apiUrl, data)
       ); 
    }

    public async returnBook(id: number, Return_date: string) {
        return lastValueFrom(
            this.http.put<any>(`${this.apiUrl}/return/${id}`, { Return_date })
        );
    }
}