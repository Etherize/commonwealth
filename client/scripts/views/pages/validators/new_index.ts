// import 'pages/validators.scss';
// import { defer } from 'rxjs';
// import m from 'mithril';
// import mixpanel from 'mixpanel-browser';

// import app, { ApiStatus } from 'state';
// import { formatAddressShort } from 'helpers/index';
// import { Coin, formatCoin } from 'adapters/currency';
// import { makeDynamicComponent } from 'models/mithril';
// import { u32 } from '@polkadot/types';
// import { HeaderExtended } from '@polkadot/api-derive';
// import { IValidators, SubstrateAccount, IValidatorData } from 'controllers/chain/substrate/account';
// import { ICosmosValidator } from 'controllers/chain/cosmos/account';
// import User from 'views/components/widgets/user';
// import PageLoading from 'views/pages/loading';
// import { ChainBase, Account, ChainClass } from 'models';
// import Substrate from 'controllers/chain/substrate/main';
// import Cosmos from 'controllers/chain/cosmos/main';
// import Sublayout from 'views/sublayout';
// import { ICommissionInfo } from 'controllers/chain/substrate/staking';

// import * as CosmosValidationViews from './cosmos';
// import { SubstratePreHeader, SubstratePresentationComponent, preHeader } from './substrate';

// export interface IValidatorAttrs {
//     stash: string;
//     total?: Coin;
//     otherTotal?: Coin;
//     nominators?: any;
//     error?: any;
//     sending?: boolean;
//     name?: string;
//     bonded?: Coin;
//     nominated?: Coin;
//     controller?: string;
//     hasNominated?: boolean;
//     onChangeHandler?: any;
//     waiting?: boolean;
//     eraPoints?: string;
//     toBeElected?: boolean;
//     blockCount?: u32;
//     hasMessage?: boolean;
//     isOnline?: boolean;
//     commission?: number;
//     apr?: number;
// }

// export interface IValidatorPageState {
//     dynamic: {
//         validators: IValidators | { [address: string]: ICosmosValidator };
//         lastHeader: HeaderExtended,
//         annualPercentRate: ICommissionInfo;
//     };
// }
// export interface IValidatorPageStateNew {
//     dynamic: {
//         globalStats: {
//             "status": "Success",
//             "stats": {
//                 "count": 20,
//                 rows: []
//             }
//         }
//     };
// }
// export const ViewNominatorsModal: m.Component<{ nominators, validatorAddr, waiting: boolean }> = {
//     view: (vnode) => {
//         return m('.ViewNominatorsModal', [
//             m('.compact-modal-title', [
//                 m('h3', `Nominators for ${formatAddressShort(vnode.attrs.validatorAddr)}`),
//             ]),
//             m('.compact-modal-body', [
//                 m('table', [
//                     m('tr', [
//                         m('th', 'Nominator'),
//                         m(`th${vnode.attrs.waiting
//                             ? '.priority'
//                             : '.amount'}`, vnode.attrs.waiting
//                             ? 'Priority'
//                             : 'Amount'),
//                     ]),
//                     vnode.attrs.nominators.map((n) => {
//                         return m('tr', [
//                             m('td', m(User, {
//                                 user: app.chain.accounts.get(n.stash),
//                                 linkify: true,
//                                 onclick: () => {
//                                     this.trigger('modalexit');
//                                 }
//                             })),
//                             m(`td${vnode.attrs.waiting
//                                 ? '.priority'
//                                 : '.amount'}`, vnode.attrs.waiting
//                                 ? n.balance
//                                 : formatCoin(n.balance, true)),
//                         ]);
//                     }),
//                 ])
//             ]),
//         ]);
//     }
// };

// export const Validators = makeDynamicComponent<{}, IValidatorPageStateNew>({
//     getObservables: (attrs) => ({
//         // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
//         groupKey: app.chain.class.toString(),
//         globalStats: defer(() => app.staking.globalStatistics()), // convert promise into observable

//     }),
//     view: (vnode) => {
//         let vComponents = [];
//         switch (app.chain.class) {
//             case ChainClass.Edgeware:
//                 vComponents = [
//                     // m(SubstratePreHeader, {
//                     //   sender: app.user.activeAccount as SubstrateAccount,
//                     //   annualPercentRate: vnode.state.dynamic.annualPercentRate,

//                     // }),
//                     // SubstratePresentationComponent(vnode.state, app.chain as Substrate),

//                     m(preHeader, {}),
//                 ];
//                 break;
//             case ChainClass.Kusama:
//             case ChainClass.Polkadot: {
//                 vComponents = [
//                     m(SubstratePreHeader, {
//                         sender: app.user.activeAccount as SubstrateAccount,
//                         annualPercentRate: vnode.state.dynamic.annualPercentRate
//                     }),
//                     SubstratePresentationComponent(vnode.state, app.chain as Substrate),
//                 ];
//                 break;
//             }
//             case ChainClass.CosmosHub:
//                 vComponents = [
//                     CosmosValidationViews.ValidationPreHeader(app.chain as Cosmos),
//                     CosmosValidationViews.ValidatorPresentationComponent(app.chain as Cosmos),
//                 ];
//                 break;
//             default:
//                 break;
//         }

//         return m('.Validators', vComponents);
//     }
// });

// const ValidatorPage: m.Component = {
//     oncreate: (vnode) => {
//         mixpanel.track('PageVisit', { 'Page Name': 'ValidatorPage' });
//     },
//     view: (vnode) => {
//         if (!app.chain) return m(PageLoading, { message: 'Chain is loading...' });

//         // Catch a Substrate validators issue where app.chain.accounts.validators
//         // makes a call using the API, which fails when API is not loaded.
//         if (app.chain.base === ChainBase.Substrate) {
//             try {
//                 (app.chain as Substrate).accounts.validators;
//             } catch (e) {
//                 return m(PageLoading);
//             }
//         }

//         return m(Sublayout, {
//             class: 'ValidatorPage',
//         }, [
//             m(Validators),
//             m('.clear'),
//         ]);
//     },
// };


// // new staking ui
// export const validators = makeDynamicComponent<{}, IValidatorPageStateNew>({
//     getObservables: (attrs) => ({
//         staking: app.staking.globalStatistics()
//     }),
//     view: (vnode) => {
//         let vComponents = [];
//         switch (app.chain.class) {
//             case ChainClass.Edgeware:
//                 vComponents = [
//                     m(SubstratePreHeader, {
//                         sender: app.user.activeAccount as SubstrateAccount,
//                         annualPercentRate: vnode.state.dynamic.annualPercentRate,

//                     }),
//                     SubstratePresentationComponent(vnode.state, app.chain as Substrate),
//                 ];
//                 break;
//             case ChainClass.Kusama:
//             case ChainClass.Polkadot: {
//                 vComponents = [
//                     m(SubstratePreHeader, {
//                         sender: app.user.activeAccount as SubstrateAccount,
//                         annualPercentRate: vnode.state.dynamic.annualPercentRate
//                     }),
//                     SubstratePresentationComponent(vnode.state, app.chain as Substrate),
//                 ];
//                 break;
//             }
//             case ChainClass.CosmosHub:
//                 vComponents = [
//                     CosmosValidationViews.ValidationPreHeader(app.chain as Cosmos),
//                     CosmosValidationViews.ValidatorPresentationComponent(app.chain as Cosmos),
//                 ];
//                 break;
//             default:
//                 break;
//         }

//         return m('.Validators', vComponents);
//     }
// });
// export default ValidatorPage;