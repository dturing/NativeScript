﻿import * as frame from "tns-core-modules/ui/frame";
import { ViewBase, View, unsetValue, isIOS } from "tns-core-modules/ui/core/view";
import { Page } from "tns-core-modules/ui/page";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout";
import { Button } from "tns-core-modules/ui/button";
import * as TKUnit from "../TKUnit";
import * as utils from "tns-core-modules/utils/utils";
import { ActionBar } from "tns-core-modules/ui/action-bar";
import { Color } from "tns-core-modules/color";

import { LayoutBase } from "tns-core-modules/ui/layouts/layout-base";
import { FlexboxLayout } from "tns-core-modules/ui/layouts/flexbox-layout";
import { FormattedString, Span } from "tns-core-modules/text/formatted-string";
import { _getProperties, _getStyleProperties } from "tns-core-modules/ui/core/properties";

var DELTA = 0.1;

export var ASYNC = 0.2;
export var MEMORY_ASYNC = 2;

export function getColor(uiColor: UIColor): Color {
    var redRef = new interop.Reference<number>();
    var greenRef = new interop.Reference<number>();
    var blueRef = new interop.Reference<number>();
    var alphaRef = new interop.Reference<number>();

    uiColor.getRedGreenBlueAlpha(redRef, greenRef, blueRef, alphaRef);
    var red = redRef.value * 255;
    var green = greenRef.value * 255;
    var blue = blueRef.value * 255;
    var alpha = alphaRef.value * 255;

    return new Color(alpha, red, green, blue);
}

function clearPage(): void {
    let newPage = getCurrentPage();
    if (!newPage) {
        throw new Error("NO CURRENT PAGE!!!!");
    }

    newPage.style.backgroundColor = unsetValue;
    newPage.style.color = unsetValue;
    newPage.bindingContext = unsetValue;
    newPage.className = unsetValue;
    newPage.id = unsetValue;
}

export function do_PageTest(test: (views: [Page, View, View, View, ActionBar]) => void, content: View, secondView: View, thirdView: View) {
    clearPage();
    let newPage = getCurrentPage();
    newPage.content = content;
    test([newPage, content, secondView, thirdView, newPage.actionBar]);
    newPage.content = null;
}

export function do_PageTest_WithButton(test: (views: [Page, Button, ActionBar]) => void) {
    clearPage();
    let newPage = getCurrentPage();
    let btn = new Button();
    newPage.content = btn;
    test([newPage, btn, newPage.actionBar]);
    newPage.content = null;
}

export function do_PageTest_WithStackLayout_AndButton(test: (views: [Page, StackLayout, Button, ActionBar]) => void) {
    clearPage();
    let newPage = getCurrentPage();
    let stackLayout = new StackLayout();
    let btn = new Button();
    stackLayout.addChild(btn);
    newPage.content = stackLayout;
    test([newPage, stackLayout, btn, newPage.actionBar]);
    newPage.content = null;
}

//export function buildUIAndRunTest(controlToTest, testFunction, pageCss?, testDelay?) {
export function buildUIAndRunTest<T extends View>(controlToTest: T, testFunction: (views: [T, Page]) => void, pageCss?) {
    clearPage();
    let newPage = getCurrentPage();

    newPage.css = pageCss;
    newPage.content = controlToTest;

    testFunction([controlToTest, newPage]);
    newPage.content = null;
    newPage.css = null;
}

export function buildUIWithWeakRefAndInteract<T extends View>(createFunc: () => T, interactWithViewFunc?: (view: T) => void, done?) {
    clearPage();
    const page = getCurrentPage();
    const weakRef = new WeakRef(createFunc());
    page.content = weakRef.get();
    if (interactWithViewFunc) {
        interactWithViewFunc(weakRef.get());
    }
    page.content = null;
    // Give a change for native cleanup (e.g. keyboard close, etc.).
    TKUnit.wait(0.001);
    if (page.ios) {
        /* tslint:disable:no-unused-expression */
        // Could cause GC on the next call.
        // NOTE: Don't replace this with forceGC();
        new ArrayBuffer(4 * 1024 * 1024);
    }
    utils.GC();

    try {
        TKUnit.assert(!weakRef.get(), weakRef.get() + " leaked!");
        done(null);
    }
    catch (ex) {
        done(ex);
    }
}

export function navigateToModuleAndRunTest(moduleName, context, testFunction) {
    let page = navigateToModule(moduleName, context);
    testFunction(page);
}

export function navigate(pageFactory: () => Page, navigationContext?: any): Page {
    let entry: frame.NavigationEntry = { create: pageFactory, animated: false, context: navigationContext, clearHistory: true };
    return navigateWithEntry(entry);
}

export function navigateWithHistory(pageFactory: () => Page, navigationContext?: any): Page {
    let entry: frame.NavigationEntry = { create: pageFactory, animated: false, context: navigationContext, clearHistory: false };
    return navigateWithEntry(entry);
}

export function navigateToModule(moduleName: string, context?: any): Page {
    let entry: frame.NavigationEntry = { moduleName: moduleName, context: context, animated: false, clearHistory: true };
    return navigateWithEntry(entry);
}

export function getCurrentPage(): Page {
    return frame.topmost().currentPage;
}

export function getClearCurrentPage(): Page {
    let page = frame.topmost().currentPage;
    page.style.backgroundColor = unsetValue;
    page.style.color = unsetValue;
    page.bindingContext = unsetValue;
    page.className = unsetValue;
    page.id = unsetValue;
    page.css = '';
    return page;
}

export function waitUntilNavigatedFrom(oldPage: Page) {
    TKUnit.waitUntilReady(() => getCurrentPage() && getCurrentPage() !== oldPage);
}

export function waitUntilLayoutReady(view: View): void {
    TKUnit.waitUntilReady(() => view.isLayoutValid);
}

export function navigateWithEntry(entry: frame.NavigationEntry): Page {
    let page = frame.resolvePageFromEntry(entry);
    entry.moduleName = null;
    entry.create = function () {
        return page;
    };

    let currentPage = getCurrentPage();
    frame.topmost().navigate(entry);
    waitUntilNavigatedFrom(currentPage);
    return page;
}

export function goBack() {
    let currentPage = getCurrentPage();
    frame.topmost().goBack();
    waitUntilNavigatedFrom(currentPage);
}

export function assertAreClose(actual: number, expected: number, message: string): void {
    const density = utils.layout.getDisplayDensity();
    const delta = Math.floor(density) !== density ? 1.1 : DELTA;

    TKUnit.assertAreClose(actual, expected, delta, message);
}

export function assertViewColor(testView: View, hexColor: string) {
    TKUnit.assert(testView.style.color, "Color property not applied correctly. Style value is not defined.");
    TKUnit.assertEqual(testView.style.color.hex, hexColor, "color property");
}

export function assertViewBackgroundColor(testView: ViewBase, hexColor: string) {
    TKUnit.assert(testView.style.backgroundColor, "Background color property not applied correctly. Style value is not defined.");
    TKUnit.assertEqual(testView.style.backgroundColor.hex, hexColor, "backgroundColor property");
}

export function forceGC() {
    if (isIOS) {
        /* tslint:disable:no-unused-expression */
        // Could cause GC on the next call.
        new ArrayBuffer(4 * 1024 * 1024);
    }

    utils.GC();
    TKUnit.wait(0.001);
}

export function _generateFormattedString(): FormattedString {
    let formattedString = new FormattedString();
    let span: Span;

    span = new Span();
    span.fontFamily = "serif";
    span.fontSize = 10;
    span.fontWeight = "bold";
    span.color = new Color("red");
    span.backgroundColor = new Color("blue");
    span.textDecoration = "line-through";
    span.text = "Formatted";
    formattedString.spans.push(span);

    span = new Span();
    span.fontFamily = "sans-serif";
    span.fontSize = 20;
    span.fontStyle = "italic";
    span.color = new Color("green");
    span.backgroundColor = new Color("yellow");
    span.textDecoration = "underline";
    span.text = "Text";
    formattedString.spans.push(span);

    return formattedString;
}

const props = _getProperties();
const styleProps = _getStyleProperties();
let setters: Map<string, any>;
let cssSetters: Map<string, any>;

export function nativeView_recycling_test(createNew: () => View, createLayout?: () => LayoutBase, nativeGetters?: Map<string, (view) => any>, customSetters?: Map<string, any>) {
    if (isIOS) {
        // recycling not implemented yet.
        return;
    }
    setupSetters();
    const page = getClearCurrentPage();
    const layout = new FlexboxLayout();
    page.content = layout;

    const first = createNew();
    const test = createNew();

    // Make sure we are not reusing a native views.
    first.recycleNativeView = false;
    test.recycleNativeView = false;

    page.content = layout;

    layout.addChild(test);

    setValue(test, setters, customSetters);
    setValue(test.style, cssSetters);

    const nativeView = test.nativeView;
    // Mark so we reuse the native views.
    test.recycleNativeView = true;
    layout.removeChild(test);
    const newer = createNew();
    newer.recycleNativeView = true;
    layout.addChild(newer);
    layout.addChild(first);

    TKUnit.assertEqual(newer.nativeView, nativeView, "nativeView not reused.");
    checkDefaults(newer, first, props, nativeGetters);
    checkDefaults(newer, first, styleProps, nativeGetters);
    layout.removeChild(newer);
    layout.removeChild(first);
}

function checkDefaults(newer: Object, first: Object, props: Array<any>, nativeGetters?: Map<string, (view) => any>): void {
    props.forEach(prop => {
        const name = (<any>prop).name;
        if (newer[prop.getDefault]) {
            TKUnit.assertDeepEqual(newer[prop.getDefault](), first[prop.getDefault](), name);
        } else if (nativeGetters && nativeGetters.has(name)) {
            const getter = nativeGetters.get(name);
            TKUnit.assertDeepEqual(getter(newer), getter(first), name);
        }
    });
}

function setValue(object: Object, setters: Map<string, any>, customSetters?: Map<string, any>): void {
    setters.forEach((value1, key) => {
        let value = customSetters && customSetters.has(key) ? customSetters.get(key) : value1;
        const currentValue = object[key];
        if (currentValue === value) {
            if (value === 'horizontal' && key === 'orientation') {
                // wrap-layout.orientation default value is 'horizontal'
                value = 'vertical';
            } else if (value === 2) {
                value = 3;
            }
        }

        object[key] = value;
        const newValue = object[key];
        TKUnit.assertNotEqual(newValue, currentValue, `${object} setting ${key} should change current value.`);
    });
}

function setupSetters(): void {
    if (setters) {
        return;
    }

    setters = new Map<string, any>();
    // view-base
    setters.set('id', "someId");
    setters.set('className', "someClassName");
    setters.set('bindingContext', "someBindingContext");

    // view
    setters.set('automationText', "automationText");
    setters.set('originX', 0.2);
    setters.set('originY', 0.2);
    setters.set('isEnabled', false);
    setters.set('isUserInteractionEnabled', false);

    // action-bar
    setters.set('title', 'title');
    setters.set('text', 'text');
    setters.set('icon', '~/logo.png');
    setters.set('visibility', 'collapse');

    // activity-indicator
    setters.set('busy', true);

    // date-picker
    setters.set('year', '2010');
    setters.set('month', '2');
    setters.set('day', '2');
    setters.set('maxDate', '2100');
    setters.set('minDate', '2000');
    setters.set('date', new Date(2011, 3, 3));

    // editable-text
    setters.set('keyboardType', 'datetime');
    setters.set('returnKeyType', 'done');
    setters.set('editable', false);
    setters.set('updateTextTrigger', 'focusLost');
    setters.set('autocapitalizationType', 'words');
    setters.set('autocorrect', true);
    setters.set('hint', 'hint');
    setters.set('maxLength', '10');

    // html-view
    setters.set('html', '<a></a>');

    // image-view
    setters.set('imageSource', '');
    setters.set('src', '');
    setters.set('loadMode', 'async');
    setters.set('isLoading', true);
    setters.set('stretch', 'none');

    // layout-base
    setters.set('clipToBounds', false);

    // absolute-layout
    setters.set('left', '20');
    setters.set('top', '20');

    // dock-layout
    setters.set('dock', 'top');
    setters.set('stretchLastChild', false);

    // grid-layout props
    setters.set('row', '1');
    setters.set('rowSpan', '2');
    setters.set('col', '1');
    setters.set('colSpan', '2');

    // stack-layout
    setters.set('orientation', 'horizontal');

    // wrap-layout
    // custom orientation value
    // setters.set('orientation', 'vertical');
    setters.set('itemWidth', '50');
    setters.set('itemHeight', '50');

    // list-picker
    setters.set('items', ['1', '2', '3']);
    setters.set('selectedIndex', '1');

    // list-view
    setters.set('items', ['1', '2', '3']);
    setters.set('itemTemplate', '<Label text="{{ $value }}" />');
    setters.set('itemTemplates', '<template key="green"><Label text="{{ $value }}" style.backgroundColor="green" /></template><template key="red"><Label text="{{ $value }}" style.backgroundColor="red" /></template>');
    setters.set('rowHeight', '50');

    // page
    setters.set('actionBarHidden', 'true');
    setters.set('backgroundSpanUnderStatusBar', 'true');
    setters.set('enableSwipeBackNavigation', 'false');

    // progress
    setters.set('value', '1');
    setters.set('maxValue', '99');

    // repeater
    setters.set('items', ['1', '2', '3']);
    setters.set('itemTemplate', '<Label text="{{ $value }}" />');
    setters.set('itemsLayout', new StackLayout());
    setters.set('rowHeight', '50');

    // scroll-view
    // custom orientation value
    //setters.set('orientation', 'horizontal');

    // search-bar
    setters.set('textFieldHintColor', 'red');
    setters.set('textFieldBackgroundColor', 'red');

    // segmented-bar
    // custom items property

    // slider
    setters.set('minValue', '5');

    // switch
    setters.set('checked', 'true');

    // tab-view
    // custom items property
    setters.set('androidOffscreenTabLimit', '2');

    // text-base
    const formattedText = new FormattedString();
    const span = new Span();
    span.text = 'span';
    formattedText.spans.push(span);
    setters.set('formattedText', formattedText);

    // text-base
    setters.set('secure', 'true');

    // time-picker
    setters.set('minHour', 1);
    setters.set('hour', 2);
    setters.set('maxHour', 11);
    setters.set('minMinute', 1);
    setters.set('minute', 2);
    setters.set('maxMinute', 11);
    setters.set('minuteInterval', 2);
    setters.set('time', new Date(2011, 2, 2, 3, 3, 3));

    cssSetters = new Map<string, any>();

    // style
    cssSetters.set('rotate', '90');
    cssSetters.set('scaleX', 2);
    cssSetters.set('scaleY', 2);
    cssSetters.set('translateX', 20);
    cssSetters.set('translateY', 20);

    cssSetters.set('clipPath', 'inset(100px 50px)');
    cssSetters.set('color', 'red');
    cssSetters.set('tintColor', 'green');
    cssSetters.set('placeholderColor', 'green');

    cssSetters.set('backgroundColor', 'red');
    cssSetters.set('backgroundImage', '~/logo.png');
    cssSetters.set('backgroundRepeat', 'repeat');
    cssSetters.set('backgroundSize', '60px 120px');
    cssSetters.set('backgroundPosition', 'center');
    cssSetters.set('borderColor', 'blue');
    cssSetters.set('borderTopColor', 'green');
    cssSetters.set('borderRightColor', 'green');
    cssSetters.set('borderBottomColor', 'green');
    cssSetters.set('borderLeftColor', 'green');
    cssSetters.set('borderWidth', '10px');
    cssSetters.set('borderTopWidth', '5px');
    cssSetters.set('borderRightWidth', '5px');
    cssSetters.set('borderBottomWidth', '5px');
    cssSetters.set('borderLeftWidth', '5px');
    cssSetters.set('borderRadius', '10px');
    cssSetters.set('borderTopLeftRadius', '5px');
    cssSetters.set('borderTopRightRadius', '5px');
    cssSetters.set('borderBottomRightRadius', '5px');
    cssSetters.set('borderBottomLeftRadius', '5px');

    cssSetters.set('fontSize', '20');
    cssSetters.set('fontFamily', 'monospace');
    cssSetters.set('fontStyle', 'italic');
    cssSetters.set('fontWeight', '100');
    cssSetters.set('font', 'italic 2 "Open Sans", sans-serif');

    // zIndex on android is not what you think...
    // cssSetters.set('zIndex', '2');
    cssSetters.set('opacity', '0.5');
    // already set through view properties.
    // cssSetters.set('visibility', 'collapse');

    cssSetters.set('letterSpacing', '2');
    cssSetters.set('textAlignment', 'center');
    cssSetters.set('textDecoration', 'underline');
    cssSetters.set('textTransform', 'capitalize');
    cssSetters.set('whiteSpace', 'normal');

    cssSetters.set('minWidth', 50);
    cssSetters.set('minHeight', 50);
    cssSetters.set('width', 100);
    cssSetters.set('height', 100);
    cssSetters.set('margin', '25');
    cssSetters.set('marginLeft', '30px');
    cssSetters.set('marginTop', '30px');
    cssSetters.set('marginRight', '30px');
    cssSetters.set('marginBottom', '30px');
    cssSetters.set('padding', '25');
    cssSetters.set('paddingLeft', '30px');
    cssSetters.set('paddingTop', '30px');
    cssSetters.set('paddingRight', '30px');
    cssSetters.set('paddingBottom', '30px');
    cssSetters.set('horizontalAlignment', 'center');
    cssSetters.set('verticalAlignment', 'center');

    cssSetters.set('transform', 'translate(5, 10), scale(1.2, 1.2), rotate(45)');

    // TabView-specific props
    cssSetters.set('tabTextColor', 'red');
    cssSetters.set('tabBackgroundColor', 'red');
    cssSetters.set('selectedTabTextColor', 'red');
    cssSetters.set('androidSelectedTabHighlightColor', 'red');

    // ListView-specific props 
    cssSetters.set('separatorColor', 'red');

    // SegmentedBar-specific props
    cssSetters.set('selectedBackgroundColor', 'red');

    // Page-specific props 
    cssSetters.set('statusBarStyle', 'light');
    cssSetters.set('androidStatusBarBackground', 'red');

    // Flexbox-layout props
    cssSetters.set('flexDirection', 'column');
    cssSetters.set('flexWrap', 'wrap');
    cssSetters.set('justifyContent', 'center');
    cssSetters.set('alignItems', 'center');
    cssSetters.set('alignContent', 'center');
    cssSetters.set('order', '2');
    cssSetters.set('flexGrow', '1');
    cssSetters.set('flexShrink', '0');
    cssSetters.set('flexWrapBefore', 'true');
    cssSetters.set('alignSelf', 'center');
    cssSetters.set('flexFlow', 'row-reverse wrap');
    cssSetters.set('flex', '2 0.2');
}
