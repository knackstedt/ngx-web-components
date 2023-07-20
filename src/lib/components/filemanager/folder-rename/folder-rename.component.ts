import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Fetch } from '../../../util';
import { NgxFileManagerConfiguration } from '../filemanager.component';

@Component({
    selector: 'app-folder-rename',
    templateUrl: './folder-rename.component.html',
    styleUrls: ['./folder-rename.component.scss'],
    imports: [
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        FormsModule
    ],
    standalone: true
})
export class FolderRenameComponent implements OnInit {

    @Input() path: string;
    @Input() name: string;
    @Input() config: NgxFileManagerConfiguration;

    constructor(
        public dialog: MatDialogRef<any>,
        private fetch: Fetch
    ) { }

    ngOnInit() {
    }

    onSave() {
        const url = this.config.apiSettings.createDirectoryUrlTemplate
                  ? this.config.apiSettings.createDirectoryUrlTemplate(this.path + this.name)
                  : this.config.apiSettings.createDirectoryUrl

        this.fetch.post(url, {path: this.path + this.name});
        this.dialog.close(true);
    }
}
