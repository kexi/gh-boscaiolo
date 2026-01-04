import React from 'react';
import { Text, Box } from 'ink';
import DeletedCommand from './DeletedCommand.js';
import StaleCommand from './StaleCommand.js';
import MergedCommand from './MergedCommand.js';
import ListCommand from './ListCommand.js';
import InteractiveCommand from './InteractiveCommand.js';
export default function App({ command, flags }) {
    const isValidCommand = command !== undefined;
    if (!isValidCommand) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" }, "Error: No command specified"),
            React.createElement(Text, null, "Run with --help for usage")));
    }
    switch (command) {
        case 'deleted':
            return React.createElement(DeletedCommand, { ...flags });
        case 'stale':
            return React.createElement(StaleCommand, { ...flags });
        case 'merged':
            return React.createElement(MergedCommand, { ...flags });
        case 'interactive':
            return React.createElement(InteractiveCommand, { ...flags });
        case 'list':
            return React.createElement(ListCommand, { ...flags });
        default:
            return React.createElement(Text, { color: "red" },
                "Unknown command: ",
                command);
    }
}
//# sourceMappingURL=App.js.map