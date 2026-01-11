'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">join documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AddTaskComponent.html" data-type="entity-link" >AddTaskComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttachmentsGalleryComponent.html" data-type="entity-link" >AttachmentsGalleryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AuthComponent.html" data-type="entity-link" >AuthComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BoardComponent.html" data-type="entity-link" >BoardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactDetailsComponent.html" data-type="entity-link" >ContactDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactDialogComponent.html" data-type="entity-link" >ContactDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactFormComponent.html" data-type="entity-link" >ContactFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactListComponent.html" data-type="entity-link" >ContactListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactsComponent.html" data-type="entity-link" >ContactsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FileUploadComponent.html" data-type="entity-link" >FileUploadComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HeaderComponent.html" data-type="entity-link" >HeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpComponent.html" data-type="entity-link" >HelpComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImageViewerComponent.html" data-type="entity-link" >ImageViewerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LegalNoticeComponent.html" data-type="entity-link" >LegalNoticeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MobileGreetingComponent.html" data-type="entity-link" >MobileGreetingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavComponent.html" data-type="entity-link" >NavComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PrivacyPolicyComponent.html" data-type="entity-link" >PrivacyPolicyComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RegisterComponent.html" data-type="entity-link" >RegisterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StartRedirectComponent.html" data-type="entity-link" >StartRedirectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SummaryComponent.html" data-type="entity-link" >SummaryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TaskCardComponent.html" data-type="entity-link" >TaskCardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TaskCreateFormComponent.html" data-type="entity-link" >TaskCreateFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TaskDetailsComponent.html" data-type="entity-link" >TaskDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TaskDialogComponent.html" data-type="entity-link" >TaskDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TaskEditFormComponent.html" data-type="entity-link" >TaskEditFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToastComponent.html" data-type="entity-link" >ToastComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthenticationService.html" data-type="entity-link" >AuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BreakpointService.html" data-type="entity-link" >BreakpointService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContactDataService.html" data-type="entity-link" >ContactDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DownloadFileService.html" data-type="entity-link" >DownloadFileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImageViewerStateService.html" data-type="entity-link" >ImageViewerStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskDataService.html" data-type="entity-link" >TaskDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToastService.html" data-type="entity-link" >ToastService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserDataService.html" data-type="entity-link" >UserDataService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/BoardColumn.html" data-type="entity-link" >BoardColumn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Contact.html" data-type="entity-link" >Contact</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContactGroup.html" data-type="entity-link" >ContactGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirestoreTask.html" data-type="entity-link" >FirestoreTask</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Subtask.html" data-type="entity-link" >Subtask</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Task.html" data-type="entity-link" >Task</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskImage.html" data-type="entity-link" >TaskImage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});