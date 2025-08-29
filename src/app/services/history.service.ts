import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historyFiles$ = new BehaviorSubject<string[]>([]);

  constructor(private http: HttpClient) {
    this.loadHistoryFiles();
  }

  private loadHistoryFiles(): void {
    this.http.get<string[]>('http://localhost:3000/api/history-files')
      .subscribe(files => {
        this.historyFiles$.next(files);
      });
  }

  getHistoryFiles(): Observable<string[]> {
    return this.historyFiles$.asObservable();
  }
}
