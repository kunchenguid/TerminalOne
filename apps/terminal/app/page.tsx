/* eslint-disable @next/next/no-img-element */
'use client';

import { DEFAULT_CONFIG } from '@terminalone/types';
import _ from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FiMenu, FiPlus, FiX } from 'react-icons/fi';

import SettingsPage from '../components/SettingsPage';
import ShellSelector from '../components/ShellSelector';
import { useConfigContext } from '../hooks/ConfigContext';

const TitleBar = dynamic(() => import('../components/TitleBar'), {
  ssr: false,
});
const Terminal = dynamic(() => import('../components/Terminal'), {
  ssr: false,
});

type UserTab = {
  tabId: number;
  shellName: string | null;
};

const Page = () => {
  const { config, loading } = useConfigContext();

  const [tabId, setTabId] = useState<number>(0);
  const [userTabs, setUserTabs] = useState<UserTab[]>([]);

  useEffect(() => {
    if (!loading && userTabs.length === 0) {
      setTabId(1);
      setUserTabs([
        {
          tabId: 1,
          shellName: config.defaultShellName,
        },
      ]);
    }
  }, [loading, config, userTabs]);

  if (loading) {
    return <div />;
  }

  const activeShellName = userTabs.find((t) => t.tabId === tabId)?.shellName || config.defaultShellName;
  const activeShellConfig = config.shells.find((s) => s.name === activeShellName) || DEFAULT_CONFIG.shells[0];
  const activeThemeConfig =
    tabId === 0
      ? DEFAULT_CONFIG.themes[0]
      : config.themes.find((t) => t.name === activeShellConfig.themeName) || DEFAULT_CONFIG.themes[0];

  return (
    <>
      <TitleBar>
        <div className="tabs">
          <a
            className={`tab tab-lifted ${tabId === 0 ? 'tab-active' : ''} flex items-center gap-1`}
            onClick={() => {
              setTabId(0);
            }}
          >
            <FiMenu />
          </a>
          {userTabs.map((userTab) => (
            <a
              key={userTab.tabId}
              className={`tab tab-lifted items-center ${tabId === userTab.tabId ? 'tab-active' : ''}`}
              style={{
                backgroundColor: tabId === userTab.tabId ? activeThemeConfig.background : undefined,
                paddingRight: tabId === userTab.tabId ? 0 : undefined,
              }}
              onClick={() => {
                if (tabId === userTab.tabId) {
                  return;
                }
                setTabId(userTab.tabId);
              }}
            >
              {userTab.tabId}
              {userTab.tabId === tabId && (
                <button
                  className="btn btn-ghost btn-square btn-xs opacity-50 hover:bg-transparent hover:opacity-100 ml-2"
                  onClick={() => {
                    const newTabs = userTabs.filter((t) => t.tabId !== userTab.tabId);
                    setUserTabs(newTabs);
                    setTabId(_.max(newTabs.map((t) => t.tabId)) || 0);
                  }}
                >
                  <FiX />
                </button>
              )}
            </a>
          ))}
          <a
            className="tab tab-lifted"
            onClick={() => {
              const newTabId = (_.max(userTabs.map((t) => t.tabId)) || 0) + 1;
              setUserTabs([
                ...userTabs,
                {
                  tabId: newTabId,
                  shellName: config.shells.length === 1 ? config.defaultShellName : null,
                },
              ]);
              setTabId(newTabId);
            }}
          >
            <FiPlus />
          </a>
        </div>
      </TitleBar>
      <div
        className="flex-1 flex overflow-hidden"
        style={{
          paddingTop: config.tabContentPadding.top,
          paddingRight: config.tabContentPadding.right,
          paddingBottom: config.tabContentPadding.bottom,
          paddingLeft: config.tabContentPadding.left,
          backgroundColor: activeThemeConfig.background,
        }}
      >
        <div className="flex-1 relative overflow-hidden">
          {tabId === 0 && <SettingsPage />}
          {userTabs.map((userTab) => {
            if (userTab.shellName) {
              return <Terminal key={userTab.tabId} active={tabId === userTab.tabId} shellName={userTab.shellName} />;
            } else {
              return (
                <ShellSelector
                  key={userTab.tabId}
                  onShellSelected={(shellName) => {
                    const newTabs = userTabs.map((t) => {
                      if (t.tabId === userTab.tabId) {
                        return {
                          ...t,
                          shellName,
                        };
                      }
                      return t;
                    });
                    setUserTabs(newTabs);
                  }}
                />
              );
            }
          })}
        </div>
      </div>
    </>
  );
};

export default Page;
