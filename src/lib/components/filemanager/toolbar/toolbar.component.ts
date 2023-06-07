import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { NgxAppMenuDirective, NgxContextMenuDirective, ContextMenuItem } from '@dotglitch/ngx-ctx-menu';

import { GtkIconButtonComponent } from './icon-button/icon-button.component';
import { GtkBreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FilemanagerComponent, FileViewTab, FSDescriptor, NgxFileManagerConfiguration } from '../filemanager.component';
import { FileSorting } from '../../../types';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    imports: [
        NgIf,
        MatIconModule,
        MatButtonModule,
        GtkIconButtonComponent,
        GtkBreadcrumbComponent,
        NgxContextMenuDirective,
        NgxAppMenuDirective
    ],
    standalone: true
})
export class ToolbarComponent {
    @ViewChild('zoomTemplate') zoomTemplate: TemplateRef<any>;
    @ViewChild('actionTemplate') actionTemplate: TemplateRef<any>;

    @Input() config: NgxFileManagerConfiguration;


    @Output() onBreadcrumbClick = new EventEmitter();

    @Input() currentTab: FileViewTab = {} as any;

    @Input() showHiddenFiles: boolean;
    @Output() showHiddenFilesChange = new EventEmitter<boolean>();
    @Input() showSidebar: boolean;
    @Output() showSidebarChange = new EventEmitter<boolean>();

    @Input() drawerMode = false;
    @Input() showBareMinimum = false;

    constructor(
        public filemanager: FilemanagerComponent
    ) {

    }

    fileOptions: ContextMenuItem<FSDescriptor>[] = [
        {
            label: "New Folder",
            action: (folder) => {
                //
            }
        },
        {
            label: "Add to Bookmarks (WIP)",
            action: (folder) => {
                //
            }
        },
        "separator",
        {
            label: "Paste",
            action: (folder) => {
                //
            }
        },
        {
            label: "Select All",
            action: (folder) => {
                //
            }
        },
        "separator",
        {
            label: "Properties",
            action: (folder) => {
                //
            }
        },

    ]

    sortOptions: ContextMenuItem<FSDescriptor>[] = [
        {
            label: "Sort",
            separator: true
        },
        {
            label: "A-Z",
            action: () => this.setSorter('a-z')
        },
        {
            label: "Z-A",
            action: () => this.setSorter('z-a')
        },
        {
            label: "Last Modified",
            action: () => this.setSorter('lastmod')
        },
        {
            label: "First Modified",
            action: () => this.setSorter('firstmod')
        },
        {
            label: "Size",
            action: () => this.setSorter('size')
        },
        {
            label: "Type",
            action: () => this.setSorter('type')
        },
        "separator",
        {
            label: "Refresh",
            action: () => this.filemanager.currentFileGrid.loadFolder()
        }
    ];

    historyBack(tab: FileViewTab) {
        console.log("history ->", tab)
        tab.historyIndex--;
        tab.path = tab.history[tab.historyIndex - 1];
    }

    historyForward(tab: FileViewTab) {
        console.log("history <-", tab)
        tab.historyIndex++;
        tab.path = tab.history[tab.historyIndex - 1];
    }

    toggleDrawer() {
        if ([...this.filemanager.drawer._drawers][0].opened)
            this.filemanager.drawer.close();
        else
            this.filemanager.drawer.open();
    }

    setSorter(mode: FileSorting) {
        this.filemanager.currentTab.sortOrder = mode;
        this.filemanager.refreshSorting();
    }
}
