import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<h1>Welcome to {{packageName}}!</h1>`,
})
export class AppComponent {
  title = '{{packageName}}';
}

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch(err => console.error(err));
