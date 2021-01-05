import $ from 'jquery';
import m from 'mithril';
import { Table, Button } from 'construct-ui';

import { CommunityInfo, ChainInfo } from 'client/scripts/models';
import { notifyError } from 'controllers/app/notifications';
import { InputPropertyRow, TogglePropertyRow, ManageRolesRow } from './metadata_rows';

interface ICommunityMetadataManagementState {
  name: string;
  description: string;
  iconUrl: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  website: string;
  chat: string;
  telegram: string;
  github: string;
  introTitle: string;
  introText: string;
}

export interface IChainOrCommMetadataManagementAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
  onRoleUpdate: Function;
  admins;
  mods;
}

const CommunityMetadataManagementTable:
m.Component<IChainOrCommMetadataManagementAttrs, ICommunityMetadataManagementState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    vnode.state.iconUrl = vnode.attrs.community.iconUrl;
    vnode.state.website = vnode.attrs.community.website;
    vnode.state.chat = vnode.attrs.community.chat;
    vnode.state.telegram = vnode.attrs.community.telegram;
    vnode.state.github = vnode.attrs.community.github;
    vnode.state.introTitle = vnode.attrs.community.introTitle;
    vnode.state.introText = vnode.attrs.community.introText;
  },
  view: (vnode) => {
    return m('.CommunityMetadataManagementTable', [m(Table, {
      bordered: false,
      interactive: false,
      striped: false,
      class: 'metadata-management-table',
    }, [
      m(InputPropertyRow, {
        title: 'Name',
        defaultValue: vnode.state.name,
        onChangeHandler: (v) => { vnode.state.name = v; },
      }),
      m(InputPropertyRow, {
        title: 'Description',
        defaultValue: vnode.state.description,
        onChangeHandler: (v) => { vnode.state.description = v; },
        textarea: true,
      }),
      m(InputPropertyRow, {
        title: 'Website',
        defaultValue: vnode.state.website,
        placeholder: 'https://example.com',
        onChangeHandler: (v) => { vnode.state.website = v; },
      }),
      m(InputPropertyRow, {
        title: 'Chat',
        defaultValue: vnode.state.chat,
        placeholder: 'https://discord.com/invite',
        onChangeHandler: (v) => { vnode.state.chat = v; },
      }),
      m(InputPropertyRow, {
        title: 'Telegram',
        defaultValue: vnode.state.telegram,
        placeholder: 'https://t.me',
        onChangeHandler: (v) => { vnode.state.telegram = v; },
      }),
      m(InputPropertyRow, {
        title: 'Github',
        defaultValue: vnode.state.github,
        placeholder: 'https://github.com',
        onChangeHandler: (v) => { vnode.state.github = v; },
      }),
      m(InputPropertyRow, {
        title: 'Intro Title',
        defaultValue: vnode.state.introTitle,
        onChangeHandler: (v) => { vnode.state.introTitle = v; },
        textarea: true,
      }),
      m(InputPropertyRow, {
        title: 'Intro Text',
        defaultValue: vnode.state.introText,
        onChangeHandler: (v) => { vnode.state.introText = v; },
        textarea: true,
      }),
      m(TogglePropertyRow, {
        title: 'Privacy',
        defaultValue: vnode.attrs.community.privacyEnabled,
        onToggle: (checked) => { vnode.state.privacyEnabled = checked; },
        caption: (checked) => checked ? 'Threads are private to members' : 'Threads are visible to the public',
      }),
      m(TogglePropertyRow, {
        title: 'Invites',
        defaultValue: vnode.attrs.community.invitesEnabled,
        onToggle: (checked) => { vnode.state.invitesEnabled = checked; },
        caption: (checked) => checked ? 'Anyone can invite new members' : 'Admins/mods can invite new members',
      }),
      m('tr', [
        m('td', 'Admins'),
        m('td', [ m(ManageRolesRow, {
          roledata: vnode.attrs.admins,
          onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
        }), ]),
      ]),
      vnode.attrs.mods.length > 0
        && m('tr', [
          m('td', 'Moderators'),
          m('td', [ m(ManageRolesRow, {
            roledata: vnode.attrs.mods,
            onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
          }), ])
        ]),
    ]),
    m(Button, {
      label: 'Save changes',
      intent: 'primary',
      onclick: async (e) => {
        const {
          name,
          description,
          iconUrl,
          website,
          chat,
          telegram,
          github,
          introTitle,
          introText,
          invitesEnabled,
          privacyEnabled,
        } = vnode.state;
        try {
          await vnode.attrs.community.updateCommunityData({
            name,
            description,
            iconUrl,
            website,
            chat,
            telegram,
            github,
            introTitle,
            introText,
            privacyEnabled,
            invitesEnabled,
          });
          $(e.target).trigger('modalexit');
        } catch (err) {
          notifyError(err.responseJSON?.error || 'Community update failed');
        }
      },
    }),
    ]);
  },
};

export default CommunityMetadataManagementTable;
