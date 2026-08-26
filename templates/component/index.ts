import { VisualComponent } from '@acrodata/visual-component-api';
import { Component } from '@angular/core';
import configs from './configs';

@Component({
  selector: 'viz-{{componentName}}',
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class {{componentClass}}Component extends VisualComponent {
  constructor() {
    super(configs);
  }

  override render(data: any, options: Record<string, any>): void {
    this.markForCheck();
  }
}
