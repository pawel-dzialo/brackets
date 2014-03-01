/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document */

define(function (require, exports, module) {
    "use strict";

    var Menus                   = brackets.getModule("command/Menus"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands                = brackets.getModule("command/Commands"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        Strings                 = brackets.getModule("strings"),
        workingSetCmenu         = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager");

    // Constants
    var closeOthers             = "file.close_others",
        closeAbove              = "file.close_above",
        closeBelow              = "file.close_below";

    // Global vars and preferences
    var commandsRegistered  = false,
        menuEntry           = {},
        prefs               = PreferencesManager.getExtensionPrefs("closeOthers");
    prefs.definePreference("enabled", "boolean", true);
    prefs.definePreference("closeAbove", "boolean", true);
    prefs.definePreference("closeBelow", "boolean", true);
    prefs.definePreference("closeOthers", "boolean", true);

    function handleClose(mode) {

        var targetIndex = DocumentManager.findInWorkingSet(DocumentManager.getCurrentDocument().file.fullPath),
            workingSet  = DocumentManager.getWorkingSet().slice(0),
            start       = (mode === closeBelow) ? (targetIndex + 1) : 0,
            end         = (mode === closeAbove) ? (targetIndex) : (workingSet.length),
            files       = [],
            i;
        
        if (mode === closeOthers) {
            end--;
            workingSet.splice(targetIndex, 1);
        }
        
        for (i = start; i < end; i++) {
            files.push(workingSet[i]);
        }
        
        CommandManager.execute(Commands.FILE_CLOSE_LIST, {fileList: files});
    }

    function _contextMenuOpenHandler() {
        var doc = DocumentManager.getCurrentDocument();
        
        if (doc) {
            var docIndex   = DocumentManager.findInWorkingSet(doc.file.fullPath),
                workingSet = DocumentManager.getWorkingSet().slice(0);
            
            if (docIndex === workingSet.length - 1) { // hide "Close Others Below" if the last file in Working Files is selected
                CommandManager.get(closeBelow).setEnabled(false);
            } else {
                CommandManager.get(closeBelow).setEnabled(true);
            }
            
            if (workingSet.length === 1) { // hide "Close Others" if there is only one file in Working Files
                CommandManager.get(closeOthers).setEnabled(false);
            } else {
                CommandManager.get(closeOthers).setEnabled(true);
            }
            
            if (docIndex === 0) { // hide "Close Others Above" if the first file in Working Files is selected
                CommandManager.get(closeAbove).setEnabled(false);
            } else {
                CommandManager.get(closeAbove).setEnabled(true);
            }
        }
    }

    function prefChangeHandler() {
        // it's senseless to look prefs up for the current file, instead look them up for the current project
        var enabled         = prefs.get("enabled", PreferencesManager.CURRENT_PROJECT),
            prefCloseAbove  = prefs.get("closeAbove", PreferencesManager.CURRENT_PROJECT) && enabled,
            prefCloseBelow  = prefs.get("closeBelow", PreferencesManager.CURRENT_PROJECT) && enabled,
            prefCloseOthers = prefs.get("closeOthers", PreferencesManager.CURRENT_PROJECT) && enabled;
        console.log(enabled);
        
        if (enabled) {
            if (!commandsRegistered) {
                CommandManager.register(Strings.CMD_FILE_CLOSE_BELOW, closeBelow, function () {
                    handleClose(closeBelow);
                });
                CommandManager.register(Strings.CMD_FILE_CLOSE_OTHERS, closeOthers, function () {
                    handleClose(closeOthers);
                });
                CommandManager.register(Strings.CMD_FILE_CLOSE_ABOVE, closeAbove, function () {
                    handleClose(closeAbove);
                });
                commandsRegistered = true;
            }
        }
        
        if (prefCloseAbove !== menuEntry.closeAbove) {
            if (prefCloseAbove) {
                workingSetCmenu.addMenuItem(closeAbove, "", Menus.AFTER, Commands.FILE_CLOSE);
            } else {
                workingSetCmenu.removeMenuItem(closeAbove);
            }
            menuEntry.closeAbove = prefCloseAbove;
        }
        if (prefCloseBelow !== menuEntry.closeBelow) {
            if (prefCloseBelow) {
                workingSetCmenu.addMenuItem(closeBelow, "", Menus.AFTER, Commands.FILE_CLOSE);
            } else {
                workingSetCmenu.removeMenuItem(closeBelow);
            }
            menuEntry.closeBelow = prefCloseBelow;
        }
        if (prefCloseOthers !== menuEntry.closeOthers) {
            if (prefCloseOthers) {
                workingSetCmenu.addMenuItem(closeOthers, "", Menus.AFTER, Commands.FILE_CLOSE);
            } else {
                workingSetCmenu.removeMenuItem(closeOthers);
            }
            menuEntry.closeOthers = prefCloseOthers;
        }
    }

    // Initialize using the prefs
    prefChangeHandler();

    // Add a context menu open handler
    $(workingSetCmenu).on("beforeContextMenuOpen", _contextMenuOpenHandler);

    prefs.on("change", prefChangeHandler);
});