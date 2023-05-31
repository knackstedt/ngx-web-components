import { NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, EventEmitter, Inject, Input, Optional, Output, TemplateRef } from '@angular/core';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NGX_WEB_COMPONENTS_CONFIG, NgxWebComponentsConfig } from '../../../types';
import { IconResolver } from '../icon-resolver';

@Component({
    selector: 'app-tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
    imports: [
        NgIf,
        NgForOf,
        NgTemplateOutlet,
        MatExpansionModule,
        MatProgressBarModule
    ],
    standalone: true
})
export class TreeViewComponent {
    @ContentChild("rowTemplate", { read: TemplateRef }) rowTemplate: TemplateRef<any>;
    @Input("rowTemplate") rowTemplateIn: TemplateRef<any>;

    @Input() data: any[];

    @Output() click = new EventEmitter();
    @Output() loadChildren = new EventEmitter();

    iconResolver: IconResolver;
    constructor(
        @Optional() @Inject(NGX_WEB_COMPONENTS_CONFIG) readonly libConfig: NgxWebComponentsConfig = {},
    ) {
        this.iconResolver = new IconResolver(libConfig.assetPath);
    }

    tryLoadChildren(item, panel: MatExpansionPanel) {
        this.loadChildren.next({
            item,
            cb: (children) => {
                item['_children'] = children;
                if (children.length == 0)
                    panel.close();
            }
        })
    }
}
