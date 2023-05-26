import { NgModule } from '@angular/core';
import { FilemanagerComponent } from 'src/lib/filemanager/filemanager.component';
import { NgxLazyLoaderModule } from '@dotglitch/ngx-lazy-loader';

@NgModule({
    imports: [
        FilemanagerComponent,
        NgxLazyLoaderModule.forRoot({
            entries: [
            ]
        }),
    ],
    exports: [FilemanagerComponent]
})
export class DotGlitchLibraryModule { }
