import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef } from '@angular/material/dialog';

import { FSDescriptor } from '../../filemanager.component';

@Component({
    selector: 'app-ctx-rename',
    templateUrl: './ctx-rename.component.html',
    styleUrls: ['./ctx-rename.component.scss'],
      imports: [
        MatInputModule,
        MatButtonModule
    ],
    standalone: true
})
export class CtxRenameComponent {
    @Input('file') file: FSDescriptor;
    @Input('dialog') dialog: MatDialogRef<any>;

    constructor() { }

    saveName() {
        this.dialog.close(this.file);
    }
}
