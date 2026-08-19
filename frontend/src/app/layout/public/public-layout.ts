import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PublicHeader } from '../public-header/public-header';
import { PublicFooter } from '../public-footer/public-footer';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        PublicHeader,
        PublicFooter,
    ],
    templateUrl: './public-layout.html',
})
export class PublicLayout { }