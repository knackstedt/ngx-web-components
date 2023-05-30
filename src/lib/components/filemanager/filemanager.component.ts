import { Component, Inject, Input, OnInit, Optional, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { AngularSplitModule } from 'angular-split';
import { NgxLazyLoaderService } from '@dotglitch/ngx-lazy-loader';

import { FileGridComponent } from './file-grid/file-grid.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { Fetch } from '../../util';
import { NGX_WEB_COMPONENTS_CONFIG, NgxWebComponentsConfig } from 'src/lib/types';

// TODO:
/**
 * Multiple music / video / image files selected turns into a playlist
 * Dragging music / video / image queues the file(s)
 * Can save and edit a list of files as playlist
 * Can "loop" "randomize"
 */

export type DirectoryDescriptor = {
    kind: "directory",
    path: string,
    name: string
    contents: {
        dirs: DirectoryDescriptor[],
        files: FileDescriptor[]
    }
}

export type FileDescriptor = {
    kind: "file",
    stats: {
        size: number;
        // Size for zipped file
        compressedSize?: number,
        atimeMs: number;
        mtimeMs: number;
        ctimeMs: number;
        birthtimeMs: number;
    },
    path: string
    name: string,
    ext: string,
    // Comment for entries in a zip file.
    comment?: string
};

export type FSDescriptor = DirectoryDescriptor | FileDescriptor;

export type FileViewTab = {
    id: string,
    label: string,
    breadcrumb: {
        id: string,
        label: string
    }[],
    path: string,
    selection: FSDescriptor[],
    viewMode: "grid" | "list",
    historyIndex: number,
    history: string[],
    sidebarItems: FSDescriptor[]
}

export type NgxFileManagerConfiguration = Partial<{
    /**
     * Initial path
     */
    path: string,
    /**
     * Maximum number of items to be stored in history.
     */
    maxHistoryLength: number,

    apiSettings: {
        listEntriesUrl: string,
        downloadEntryUrl: string,
        uploadEntryUrl: string
    },

    /**
     * The path that images are loaded from.
     * Default value `/assets/dotglitch/webcomponents/`
     */
    assetPath: string,
    sidebarLocationStrategy: "known" | "currentDirectory"
}>

@Component({
    selector: 'app-filemanager',
    templateUrl: './filemanager.component.html',
    styleUrls: ['./filemanager.component.scss'],
    imports: [
        CommonModule,
        AngularSplitModule,
        FileGridComponent,
        MatTabsModule,
        MatIconModule,
        ToolbarComponent
    ],
    providers: [
        NgxLazyLoaderService
    ],
    standalone: true
})
export class FilemanagerComponent implements OnInit {
    @ViewChildren(FileGridComponent) fileGrids: FileGridComponent[];
    @ViewChild('tabGroup') tabGroup: MatTabGroup;

    @Input() config: NgxFileManagerConfiguration = {
        apiSettings: {
            listEntriesUrl: `/api/filesystem/`,
            uploadEntryUrl: ``,
            downloadEntryUrl: ``
        }
    };

    showHiddenFiles = false;
    showSidebar = true;

    viewMode = "list";

    sortOrder: "a-z" | "z-a" | "lastmod" | "firstmod" | "size" | "type" = "a-z";

    isHomeAncestor = false;

    currentTab: FileViewTab = {} as any;
    tabIndex = 0;
    tabs: FileViewTab[] = [];

    constructor(
    ) {
    }

    ngOnInit(): void {
        this.initTab(this.config.path);
        this.currentTab = this.tabs[0];
    }

    initTab(path: string) {
        this.tabs.push(this.currentTab = {
            id: crypto.randomUUID(),
            label: this.getTabLabel(path),
            breadcrumb: this.calcBreadcrumb(path),
            path,
            selection: [],
            viewMode: "grid",
            historyIndex: 0,
            history: [],
            sidebarItems: []
        });
        this.tabIndex = this.tabs.length;
    }

    closeTab(tab: FileViewTab) {
        this.tabs.splice(this.tabs.findIndex(t => t.id == tab.id), 1);
    }

    calcBreadcrumb(path: string) {
        if (!path) return null;

        const parts = path.replace("#/", '/').split('/');
        return parts.map((p, i) => {
            const path = parts.slice(0, i + 1).join('/');

            return {
                id: path || '/',
                label: p || ""
            };
        });
    }

    onBreadcrumbClick(crumb) {
        if (crumb.id) {
            this.currentTab.path = crumb.id;
            this.currentTab.breadcrumb = this.calcBreadcrumb(crumb.id);
        }
    }

    onTabPathChange(tab: FileViewTab) {
        tab.label = this.getTabLabel(tab.path);
        tab.breadcrumb = this.calcBreadcrumb(tab.path);

        tab.historyIndex++;
        tab.history.push(tab.path);
        tab.history.splice(typeof this.config.maxHistoryLength == 'number' ? this.config.maxHistoryLength : 50);
    }

    onTabLoadFiles(tab: FileViewTab, files: FSDescriptor[]) {
        tab.sidebarItems = files.filter(f => f.kind == "directory")
    }

    getTabLabel(path: string) {
        return path?.split('/').filter(p => p).pop();
    }

    async onFileOpen(files: FSDescriptor[]) {

    }

    async onResize() {
        // Trigger re-calculation of the view
        this.fileGrids.forEach(g => g.resize());
    }

    async onResizeEnd() {
        setTimeout(() => {
            this.onResize()
        }, 250);
    }
}
