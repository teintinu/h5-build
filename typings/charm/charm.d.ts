// Type definitions for charm 1.0.0
// Project: https://github.com/thr0w/charm
// Definitions by: thr0w bellomy <https://github.com/thr0w>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare interface Charm {

    removeAllListeners(event: "^C"): void;
    removeAllListeners(event: "^D"): void;
    removeAllListeners(event: string): void;
    on(event: "^C", cb: () => void): void;
    on(event: "^D", cb: () => void): void;
    on(event: string, cb: () => void): void;

    /** Reset the entire screen, like the /usr/bin/reset command. */

    reset(): void;
    /** Emit an "end" event downstream. */
    destroy(): void;
    /** Emit an "end" event downstream. */
    end(): void;

    /** Pass along msg to the output stream. */
    write(msg: any): void;

    /** Set the cursor position to the absolute coordinates x, y. */
    position(x: number, y: number): void;

    /** Query the absolute cursor position from the input stream through the output stream (the shell does this automatically) and get the response back as cb(x, y). */

    position(cb: (x: number, y: number) => void): void;

    /** Move the cursor position by the relative coordinates x, y. */

    move(x: number, y: number): void;

    /** Move the cursor up by y rows. */

    up(y: number): void;

    /** Move the cursor down by y rows. */

    down(y: number): void;

    /** Move the cursor left by x columns. */

    left(x: number): void;

    /** Move the cursor right by x columns. */
    right(x: number): void;

    /** Push the cursor state and optionally the attribute state. */
    push(withAttributes?: boolean): void;

    /* Pop the cursor state and optionally the attribute state. */
    pop(withAttributes?: boolean): void;

    /* Erase a region defined by the string s.

    s can be:

    end - erase from the cursor to the end of the line
    start - erase from the cursor to the start of the line
    line - erase the current line
    down - erase everything below the current line
    up - erase everything above the current line
    screen - erase the entire screen

    */
    erase(s: "end"): void;
    erase(s: "start"): void;
    erase(s: "line"): void;
    erase(s: "down"): void;
    erase(s: "up"): void;
    erase(s: "screen"): void;
    erase(s: string): void;

    /**
    Delete 'line' or 'char's. delete differs from erase because it does not write over the deleted characters with whitesapce, but instead removes the deleted space.

    mode can be 'line' or 'char'. n is the number of items to be deleted. n must be a positive integer.

    The cursor position is not updated.
    */

    delete(mode: "line", n: number): void;
    delete(mode: "char", n: number): void;
    delete(mode: string, n: number): void;

    /**
    Insert space into the terminal. insert is the opposite of delete.
    mode can be 'line' or 'char'. n is the number of items to be inserted. n must be a positive integer.

    The cursor position is not updated.
    */

    insert(mode: "line", n: number): void;
    insert(mode: "char", n: number): void;
    insert(mode: string, n: number): void;

    /** Set the display mode with the string attr.

    attr can be:

    reset
    bright
    dim
    underscore
    blink
    reverse
    hidden
    */
    display(attr: "reset"): void;
    display(attr: "bright"): void;
    display(attr: "dim"): void;
    display(attr: "underscore"): void;
    display(attr: "blink"): void;
    display(attr: "reverse"): void;
    display(attr: "hidden"): void;
    display(attr: string): void;

    /**
    Set the foreground color with the string color, which can be:

    red
    yellow
    green
    blue
    cyan
    magenta
    black
    white
    or color can be an integer from 0 to 255, inclusive.
    */
    foreground(color: "red"): void;
    foreground(color: "yellow"): void;
    foreground(color: "green"): void;
    foreground(color: "blue"): void;
    foreground(color: "cyan"): void;
    foreground(color: "magenta"): void;
    foreground(color: "black"): void;
    foreground(color: "white"): void;
    foreground(color: string): void;
    foreground(color: number): void;

    /**
    Set the background color with the string color, which can be:

            red
            yellow
            green
            blue
            cyan
            magenta
            black
            white
            or color can be an integer from 0 to 255, inclusive.
    */

    background(color: "red"): void;
    background(color: "yellow"): void;
    background(color: "green"): void;
    background(color: "blue"): void;
    background(color: "cyan"): void;
    background(color: "magenta"): void;
    background(color: "black"): void;
    background(color: "white"): void;
    background(color: string): void;
    background(color: number): void;

    /** Set the cursor visibility with a boolean visible. */
    cursor(visible: boolean): void;

}

/** Create a new readable/writable charm stream.

You can pass in readable or writable streams as parameters and they will be piped to or from accordingly. You can also pass process in which case process.stdin and process.stdout will be used.

You can pipe() to and from the charm object you get back.
*/
declare function charm(...streams: any[]): Charm
declare module "charm" {
  export = charm;
}
