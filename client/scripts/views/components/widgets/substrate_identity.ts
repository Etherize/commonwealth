/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';
import { link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity, { IdentityQuality, getIdentityQuality } from 'controllers/chain/substrate/identity';
import { formatAddressShort } from '../../../../../shared/utils';

export interface ISubstrateIdentityAttrs {
  account: Account<any>;
  linkify: boolean;
  profile: Profile;
  hideIdentityIcon: boolean; // only applies to substrate identities
  showAddressWithDisplayName?: boolean;
  addrShort: string;
}

export interface ISubstrateIdentityState {
  dynamic: {
    identity: SubstrateIdentity | null;
  },
}

const SubstrateOnlineIdentityWidget = makeDynamicComponent<ISubstrateIdentityAttrs, ISubstrateIdentityState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    identity: (attrs.account instanceof SubstrateAccount && !attrs.profile.isOnchain
               && (app.chain as Substrate).identities)
      ? (app.chain as Substrate).identities.get(attrs.account)
      : null,
  }),
  view: (vnode) => {
    const { profile, linkify, account, addrShort, hideIdentityIcon, showAddressWithDisplayName } = vnode.attrs;

    // return polkadot identity if possible
    let displayName: string;
    let quality: IdentityQuality;
    if (profile.isOnchain) {
      // first try to use identity fetched from server
      displayName = (showAddressWithDisplayName ? profile.displayNameWithAddress : profile.displayName);
      quality = getIdentityQuality(Object.values(profile.judgements));
    } else if (vnode.state.dynamic?.identity?.exists) {
      // then attempt to use identity fetched from chain
      displayName = showAddressWithDisplayName
        ? `${vnode.state.dynamic.identity.username} · ${formatAddressShort(profile.address, profile.chain)}`
        : vnode.state.dynamic.identity.username;
      quality = vnode.state.dynamic.identity.quality;
    }

    if (displayName && quality && !hideIdentityIcon) {
      const name = [ displayName, m(`span.identity-icon${quality === IdentityQuality.Good
        ? '.green' : quality === IdentityQuality.Bad
          ? '.red' : '.gray'}`, [
        quality === IdentityQuality.Good ? '✓' : quality === IdentityQuality.Bad ? '✗' : '-'
      ]) ];

      return linkify
        ? link(
          `a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`,
          profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
          name
        )
        : m(`a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`, name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link('a.user-display-name.username',
        profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
        profile ? (showAddressWithDisplayName ? profile.displayNameWithAddress : profile.displayName) : addrShort)
      : m('a.user-display-name.username', [
        profile
          ? (showAddressWithDisplayName ? profile.displayNameWithAddress : profile.displayName)
          : addrShort
      ]);
  }
});

const SubstrateOfflineIdentityWidget: m.Component<ISubstrateIdentityAttrs, ISubstrateIdentityState> = {
  view: (vnode) => {
    const { profile, linkify, account, addrShort, hideIdentityIcon, showAddressWithDisplayName } = vnode.attrs;

    const quality = profile?.isOnchain && profile?.name && getIdentityQuality(Object.values(profile.judgements));

    if (profile?.isOnchain && profile?.name && quality && !hideIdentityIcon) {
      const name = [
        showAddressWithDisplayName
          ? [ profile.name, ` · ${formatAddressShort(profile.address, profile.chain)}` ]
          : profile.name,
        m(`span.identity-icon${quality === IdentityQuality.Good
          ? '.green' : quality === IdentityQuality.Bad
            ? '.red' : '.gray'}`, [
          quality === IdentityQuality.Good ? '✓' : quality === IdentityQuality.Bad ? '✗' : '-'
        ])
      ];

      return linkify
        ? link(
          `a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`,
          profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
          name
        )
        : m(`a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`, name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link('a.user-display-name.username',
        profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
        profile ? (showAddressWithDisplayName ? profile.displayNameWithAddress : profile.displayName) : addrShort)
      : m('a.user-display-name.username', [
        profile
          ? (showAddressWithDisplayName ? profile.displayNameWithAddress : profile.displayName)
          : addrShort
      ]);
  }
};

const SubstrateIdentityWidget: m.Component<ISubstrateIdentityAttrs, ISubstrateIdentityState> = {
  view: (vnode) => {
    if (app.chain?.loaded && vnode.attrs.account && (app.chain as Substrate).identities?.initialized) {
      return m(SubstrateOnlineIdentityWidget, vnode.attrs);
    } else {
      return m(SubstrateOfflineIdentityWidget, vnode.attrs);
    }
  }
};

export default SubstrateIdentityWidget;
