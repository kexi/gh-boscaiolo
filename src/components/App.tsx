import React from 'react';
import { Text, Box } from 'ink';
import DeletedCommand from './DeletedCommand.js';
import StaleCommand from './StaleCommand.js';
import MergedCommand from './MergedCommand.js';
import ListCommand from './ListCommand.js';
import InteractiveCommand from './InteractiveCommand.js';
import type { CommandFlags } from '../types/index.js';

interface AppProps {
  command: string | undefined;
  flags: CommandFlags;
}

export default function App({ command, flags }: AppProps) {
  const isValidCommand = command !== undefined;

  if (!isValidCommand) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: No command specified</Text>
        <Text>Run with --help for usage</Text>
      </Box>
    );
  }

  switch (command) {
    case 'deleted':
      return <DeletedCommand {...flags} />;
    case 'stale':
      return <StaleCommand {...flags} />;
    case 'merged':
      return <MergedCommand {...flags} />;
    case 'interactive':
      return <InteractiveCommand {...flags} />;
    case 'list':
      return <ListCommand {...flags} />;
    default:
      return <Text color="red">Unknown command: {command}</Text>;
  }
}
