import { Component, EventEmitter, Inject, Input, OnInit, Optional, Output, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawerContainer, MatSidenavModule } from '@angular/material/sidenav';
import { AngularSplitModule } from 'angular-split';
import { NgxLazyLoaderService } from '@dotglitch/ngx-lazy-loader';

import { FileGridComponent } from './file-grid/file-grid.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { Fetch } from '../../util';
import { FileSorting, NGX_WEB_COMPONENTS_CONFIG, NgxWebComponentsConfig } from '../../types';
import { IconResolver } from './icon-resolver';

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
    sidebarItems: FSDescriptor[],
    sortOrder: FileSorting
}

export type NgxFileManagerConfiguration = Partial<{
    /**
     * Initial path
     */
    path: string,

    /**
     * Name of the "root" path `/`
     * Defaults to "Storage"
     */
    rootName: string,

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
    sidebarLocationStrategy: "known" | "currentDirectory",

    iconResolver: (file: FSDescriptor) => string,

    imageSize: "normal" | "small" | "huge",

    /**
     * This determines if the filemanager shows selected entries
     *
     * If set to `focusFiles`, file paths that match from the provided `focusedFiles`
     * will be highlighted, and can be selected / deselected.
     */
    mode: "focusFiles" | "normal",
    focusedFiles: string[]
}>

@Component({
    selector: 'app-filemanager',
    templateUrl: './filemanager.component.html',
    styleUrls: ['./filemanager.component.scss'],
    imports: [
        NgIf,
        NgForOf,
        AngularSplitModule,
        FileGridComponent,
        MatTabsModule,
        MatIconModule,
        MatSidenavModule,
        ToolbarComponent,
        TreeViewComponent
    ],
    providers: [
        NgxLazyLoaderService
    ],
    standalone: true
})
export class FilemanagerComponent implements OnInit {
    @ViewChild('tabGroup') tabGroup: MatTabGroup;
    @ViewChildren(FileGridComponent) fileGrids: FileGridComponent[];
    @ViewChild(TreeViewComponent) treeView: TreeViewComponent;
    @ViewChild(ToolbarComponent) toolbar: ToolbarComponent;
    @ViewChild(MatDrawerContainer) drawer: MatDrawerContainer;


    @Input() config: NgxFileManagerConfiguration = {
        apiSettings: {
            listEntriesUrl: `/api/filesystem/`,
            uploadEntryUrl: ``,
            downloadEntryUrl: ``
        }
    };

    @Input() gridSize: "small" | "normal" | "large" = "normal";
    @Input() mode: "grid" | "list";


    @Input() value: FSDescriptor[] = [];
    @Output() valueChange = new EventEmitter<FSDescriptor[]>();

    gridValues: FSDescriptor[][] = [];

    /**
     * Emits when focused files change.
     * Only available in `focusFiles` mode.
     */
    @Output() focusedFilesChange = new EventEmitter();
    /**
     * Emits when a file is uploaded.
     */
    @Output() fileUpload = new EventEmitter();
    /**
     * Emits when a file is downloaded.
     */
    @Output() fileDownload = new EventEmitter();
    @Output() fileRename = new EventEmitter();
    @Output() fileDelete = new EventEmitter();
    @Output() fileCopy = new EventEmitter();
    @Output() filePaste = new EventEmitter();

    showHiddenFiles = false;
    showSidebar = true;
    sidebarOverlay = false;
    width = 0;

    isHomeAncestor = false;

    currentTab: FileViewTab = {} as any;
    get currentFileGrid() { return this.fileGrids[this.tabIndex] }
    tabIndex = 0;
    tabs: FileViewTab[] = [];

    iconResolver: IconResolver;

    constructor (
        @Optional() @Inject(NGX_WEB_COMPONENTS_CONFIG) readonly libConfig: NgxWebComponentsConfig = {},
        private viewContainer: ViewContainerRef,
        private fetch: Fetch
    ) {
        this.iconResolver = new IconResolver(libConfig.assetPath);
    }

    ngOnInit(): void {
        this.initTab(this.config.path);
        this.currentTab = this.tabs[0];
    }

    ngAfterViewInit() {
        this.onResize();

        setTimeout(() => this.onResize(), 250);
    }

    onTreeViewLoadChildren({item, cb}) {
        this.fetch.post(this.config.apiSettings.listEntriesUrl, { path: item.path + item.name, showHidden: this.showHiddenFiles })
            .then((data: any) => {
                const dirs: DirectoryDescriptor[] = data.dirs;
                cb(dirs);
            })
    }

    initTab(path: string) {
        this.tabs.push(this.currentTab = {
            id: crypto.randomUUID(),
            label: this.getTabLabel(path),
            breadcrumb: this.calcBreadcrumb(path),
            path,
            selection: [],
            viewMode: this.mode || 'grid',
            historyIndex: 0,
            history: [],
            sidebarItems: [],
            sortOrder: 'a-z'
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

    onTreeViewSelect(item: FSDescriptor) {
        console.log("treeviewselect", item);
        this.currentTab.path = item.path + item.name;
    }

    onTabLoadFiles(tab: FileViewTab, files: FSDescriptor[]) {
        // tab.sidebarItems = files.filter(f => f.kind == "directory");
        // return;

        console.log(tab, files);

        if (tab.sidebarItems.length == 0) {
            tab.sidebarItems = files.filter(f => f.kind == "directory");
            return;
        }

        const currentItems = tab.sidebarItems;
        const dirItems = files.filter(f => f.kind == "directory");

        function recurse(items) {
            return items.find(i => tab.path?.startsWith(i.path));
        }
        const target = recurse(currentItems);

        target['_children'] = dirItems;

        tab.sidebarItems = currentItems;
    }

    onGridValueChange() {
        this.value = this.gridValues.flat(1);
        this.valueChange.emit(this.value)
    }

    getTabLabel(path: string) {
        return path?.split('/').filter(p => p).pop();
    }

    async onFileOpen(files: FSDescriptor[]) {

    }

    async onResize() {
        // Trigger re-calculation of the view
        this.fileGrids.forEach(g => g.resize());

        const el = this.viewContainer.element.nativeElement as HTMLElement;
        const bounds = el.getBoundingClientRect();
        this.width = bounds.width;

        // If the view area is less than 650px wide, use overlay the sidebar panel
        this.sidebarOverlay = bounds.width < 650;
        if (this.sidebarOverlay == false && [...this.drawer._drawers][0].opened) {
            this.drawer.close();
        }
    }

    async onResizeEnd() {
        this.onResize();

        setTimeout(() => this.onResize(), 250);
    }

    getSelection() {
        if (this.currentTab.viewMode == "grid") {
            return this.currentTab.selection
        }
        else {
            return this.value;
        }
    }

    clearSelection() {
        this.fileGrids.forEach(g => g.clearSelection());
    }

    // Tell the child grid to refresh it's sorting
    refreshSorting() {
        this.fileGrids.forEach(g => g.sort());
    }
}
