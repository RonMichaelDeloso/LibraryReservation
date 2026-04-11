import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs"; // Removed 'last' since it wasn't used

@Injectable({
    providedIn: 'root'
})

export class BookService {
    private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:3000/api/books';

    public async getAllBooks(){
        return lastValueFrom(
            this.http.get<any[]>(this.apiUrl)
        );
    }

    public async getBookById(id: number) {
        return lastValueFrom(
            this.http.get<any>(`${this.apiUrl}/${id}`) // Fixed typo: $[id} → ${id}
        );
    }

    public async addBook(data: FormData) {
        return lastValueFrom(
            this.http.post<any>(this.apiUrl, data)
        );
    }

    public async updateBook(id: number, data: FormData) {
        return lastValueFrom(
            this.http.put<any>(`${this.apiUrl}/${id}`, data)
        );
    }

    public async deleteBook(id: number) {
        return lastValueFrom(
            this.http.delete<any>(`${this.apiUrl}/${id}`)
        );
    }

    public async getAllGenres() {
        return lastValueFrom(
            this.http.get<any[]>(`${this.apiUrl}/genres`)
        );
    }
}