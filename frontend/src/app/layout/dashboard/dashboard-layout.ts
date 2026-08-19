import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
  ],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  readonly menuAbierto = signal(false);
}