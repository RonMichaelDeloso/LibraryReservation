import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class apiService {
    private http = inject(HttpClient);
    private API_URL = 'http://localhost:3000/api'
}