import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrchestratorService {

  joinAppState: WritableSignal<JoinAppState> = signal("SIGNED_OUT");

  constructor() { }
}

type JoinAppState =  "SIGNED_OUT" | "AUTHENTICATED" | "USER_INITIALIZED" | "APP_READY"; 
