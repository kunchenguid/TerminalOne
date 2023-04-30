'use client';

import { DEFAULT_CONFIG } from '@terminalone/types';
import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebglAddon } from 'xterm-addon-webgl';

import { useConfigContext } from '../../hooks/ConfigContext';

let nextId = 0;

const Terminal = ({ active, shellName }: { active: boolean; shellName: string }) => {
  const { config, loading } = useConfigContext();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }
    if (!window || !window.TerminalOne) {
      return;
    }
    if (loading) {
      return;
    }

    const terminalDiv = terminalRef.current;

    // TODO: refactor this into multiple effects
    const terminal = new XTerm();
    terminal.loadAddon(new WebglAddon());

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalDiv);

    const terminalId = (nextId++).toString();
    const activeShellConfig = config.shells.find((s) => s.name === shellName) || DEFAULT_CONFIG.shells[0];
    // when the following values are empty, they will be auto determined based on system defaults
    const shellCommand = activeShellConfig.command;
    const startupDirectory = activeShellConfig.startupDirectory;
    const theme = config.themes.find((t) => t.name === activeShellConfig.themeName) || DEFAULT_CONFIG.themes[0];

    terminal.options.cursorBlink = config.cursorBlink;
    terminal.options.cursorStyle = config.cursorStyle;
    terminal.options.cursorWidth = config.cursorWidth;
    terminal.options.scrollback = config.scrollback;
    terminal.options.fontSize = config.fontSize;
    terminal.options.fontFamily = config.fontFamily;
    terminal.options.fontWeight = config.fontWeight;
    terminal.options.fontWeightBold = config.fontWeightBold;
    terminal.options.theme = theme;

    window.TerminalOne?.terminal
      .newTerminal(terminalId, terminal.cols, terminal.rows, shellCommand, startupDirectory)
      .then(() => {
        terminal.onData((data) => {
          window.TerminalOne?.terminal?.writeTerminal(terminalId, data);
        });
        terminal.onResize(({ cols, rows }) => {
          window.TerminalOne?.terminal?.resizeTerminal(terminalId, cols, rows);
        });
        window.TerminalOne?.terminal?.onData((_e, id: string, data: string) => {
          if (id !== terminalId) {
            return;
          }
          terminal.write(data);
        });

        // make backend pty size consistent with xterm on the frontend
        window.TerminalOne?.terminal?.resizeTerminal(terminalId, terminal.cols, terminal.rows);
      });

    const resizeListener = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', resizeListener);

    const focusListener = () => {
      fitAddon.fit();
      terminal.focus();
    };
    terminalDiv.addEventListener('focus', focusListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      terminalDiv.removeEventListener('focus', focusListener);

      window.TerminalOne?.terminal?.killTerminal(terminalId);
      terminal.dispose();
    };
  }, [terminalRef, shellName, config, loading]);

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }

    if (active) {
      terminalRef.current.focus();
    }
  }, [terminalRef, active]);

  return (
    <div
      className={`flex-1 w-full h-full absolute overflow-hidden ${active ? 'visible' : 'invisible'}`}
      tabIndex={1}
      ref={terminalRef}
    />
  );
};

export default Terminal;
