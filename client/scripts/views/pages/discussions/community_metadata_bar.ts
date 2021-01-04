import 'pages/discussions/community_metadata_bar.scss';

import { slugify } from 'helpers';
import m from 'mithril';

import app from 'state';
import { AddressInfo, AbridgedThread } from 'models';
import User from 'views/components/widgets/user';
import CommunityInfoModule from 'views/components/sidebar/community_info_module';
import SubscriptionButton from 'views/components/sidebar/subscription_button';

export const MostActiveUser: m.Component<{ user: AddressInfo, activityCount: number }, {}> = {
  view: (vnode) => {
    const { user, activityCount } = vnode.attrs;
    const profile = app.profiles.getProfile(user.chain, user.address);
    return m('.MostActiveUser', [
      m(User, {
        user: profile,
        avatarSize: 24,
        linkify: true,
        popover: true,
      }),
      m('.activity-count', activityCount)
    ]);
  }
};

export const MostActiveThread: m.Component<{ thread: AbridgedThread }> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    return m('.MostActiveThread', [
      m('.active-thread', [
        m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-`
              + `${slugify(thread.title)}`);
          }
        }, thread.title),
      ]),
      m(User, {
        user: new AddressInfo(null, thread.address, thread.authorChain, null),
        linkify: true,
      }),
    ]);
  }
};

export const ListingSidebar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    const activeAddresses = app.recentActivity.getMostActiveUsers();
    // const activeThreads = app.recentActivity.getMostActiveThreads(entity);
    return m('.ListingSidebar.forum-container.proposal-sidebar', [
      m(CommunityInfoModule),
      activeAddresses.length > 0
      && m('.user-activity', [
        m('.user-activity-header', 'Active members'),
        m('.active-members', activeAddresses.map((user) => {
          return m(MostActiveUser, {
            user: user.info,
            activityCount: user.count
          });
        })),
      ]),
      // m('.forum-activity', [
      //   m('.forum-activity-header', 'Active threads'),
      //   m('.active-threads', activeThreads.map((thread) => {
      //     return m(MostActiveThread, { thread });
      //   }))
      // ]),
      m('.admins-mods', [
        m('.admins-mods-header', 'Admins and moderators'),
        (app.chain || app.community) && m('.active-members', [
          (app.chain ? app.chain.meta.chain : app.community.meta).adminsAndMods.map((role) => {
            return m(User, {
              user: new AddressInfo(null, role.address, role.address_chain, null),
              avatarSize: 24,
              linkify: true,
              popover: true,
            });
          }),
        ]),
      ]),
      m(SubscriptionButton),
    ]);
  }
};

const CommunityMetadataBar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    const activeAddresses = app.recentActivity.getMostActiveUsers();
    // const activeThreads = app.recentActivity.getMostActiveThreads(entity);
    // available: thread.title, thread.address, thread.authorChain, ...
    //   m.route.set(`/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-${slugify(thread.title)}`);
    return m('.CommunityMetadataBar', [
      activeAddresses.length > 0
      && m('.user-activity', [
        m('.user-activity-header', 'Active members'),
        m('.active-members', activeAddresses.map((user) => {
          return m(User, {
            user: user.info,
            avatarSize: 24,
            avatarOnly: true,
            linkify: true,
            popover: true,
          });
          // TODO: show user.count
        })),
      ]),
      m('.admins-mods', [
        m('.admins-mods-header', 'Admins and mods'),
        (app.chain || app.community) && m('.active-members', [
          (app.chain ? app.chain.meta.chain : app.community.meta).adminsAndMods.map((role) => {
            return m(User, {
              user: new AddressInfo(null, role.address, role.address_chain, null),
              avatarSize: 24,
              avatarOnly: true,
              linkify: true,
              popover: true,
            });
          }),
        ]),
      ]),
    ]);
  }
};

export default CommunityMetadataBar;
