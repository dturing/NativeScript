import { EventData } from "tns-core-modules/data/observable";
import { SubMainPageViewModel } from "../sub-main-page-view-model";
import { WrapLayout } from "tns-core-modules/ui/layouts/wrap-layout";
import { Page } from "tns-core-modules/ui/page";

export function pageLoaded(args: EventData) {
    const page = <Page>args.object;
    const wrapLayout = <WrapLayout>page.getViewById("wrapLayoutWithExamples");
    page.bindingContext = new SubMainPageViewModel(wrapLayout, loadExamples());
}

export function loadExamples() {
    const examples = new Map<string, string>();
    examples.set("gestures", "gestures");
    examples.set("touch", "touch-event");
    examples.set("pan", "pan-event");
    examples.set("handlers", "handlers");
    examples.set("console", "console");
    examples.set("i61", "i61");
    examples.set("i73", "i73");
    examples.set("i86", "i86");

    return examples;
}
