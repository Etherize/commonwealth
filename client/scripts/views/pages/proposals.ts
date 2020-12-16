
import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, ChainNetwork } from 'models';
import Edgeware from 'controllers/chain/edgeware/main';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Marlin from 'controllers/chain/ethereum/marlin/adapter';
import NewProposalPage from 'views/pages/new_proposal/index';
import { Grid, Col, List } from 'construct-ui';
import moment from 'moment';
import Listing from './listing';
import ErrorPage from './error';
import PageNotFound from './404';
import BN from 'bn.js';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m(Grid, {
      align: 'middle',
      class: 'stats-container',
      gutter: 5,
      justify: 'space-between'
    }, [
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Next referendum'),
          (app.chain as Substrate).democracyProposals.nextLaunchBlock
            ? m(CountdownUntilBlock, {
              block: (app.chain as Substrate).democracyProposals.nextLaunchBlock,
              includeSeconds: false
            })
            : '--',
        ]),
      ]),
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Enactment delay'),
          (app.chain as Substrate).democracy.enactmentPeriod
            ? blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod).asDays()
            : '--',
          ' days'
        ]),
      ]),
    ]);
  }
};

const MarlinProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m(Grid, {
      align: 'middle',
      class: 'stats-container',
      gutter: 5,
      justify: 'space-between'
    }, [
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Marlin Basics'),
          m('.stats-tile-figure-major', [
            `Quorum Votes: ${(app.chain as Marlin).governance?.quorumVotes.div(new BN('1000000000000000000')).toString()} MPOND`
          ]),
          m('.stats-tile-figure-minor', [
            `Proposal Threshold: ${(app.chain as Marlin).governance?.proposalThreshold.div(new BN('1000000000000000000')).toString()} MPOND`
          ]),
          m('.stats-tile-figure-minor', [
            `Voting Period Length: ${(app.chain as Marlin).governance.votingPeriod.toString(10)}`,
          ]),
        ]),
      ]),
    ]);
  }
};

async function loadCmd() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base !== ChainBase.Substrate) {
    return;
  }
  const chain = (app.chain as Substrate);
  await Promise.all([
    chain.council.init(chain.chain, chain.accounts),
    chain.signaling.init(chain.chain, chain.accounts),
    chain.democracyProposals.init(chain.chain, chain.accounts),
    chain.democracy.init(chain.chain, chain.accounts),
  ]);
}

const ProposalsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ProposalsPage' });
    let returningFromThread = false;
    Object.values(ProposalType).forEach((type) => {
      if (app.lastNavigatedBack() && app.lastNavigatedFrom().includes(`/proposal/${type}/`)) {
        returningFromThread = true;
      }
    });
    if (returningFromThread && localStorage[`${app.activeId()}-proposals-scrollY`]) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage[`${app.activeId()}-proposals-scrollY`]));
      }, 1);
    }
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: 'Proposals',
        });
      }
      if (app.chain?.failed) return m(PageNotFound, {
        title: 'Wrong Ethereum Provider Network!',
        message: 'Change Metamask to point to Ropsten Testnet',
      });
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Proposals',
        showNewProposalButton: true,
      });
    }

    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.class === ChainClass.Moloch;
    const onMarlin = app.chain && (app.chain.network === ChainNetwork.Marlin || app.chain.network === ChainNetwork.MarlinTestnet);

    if (onSubstrate) {
      // Democracy, Council, and Signaling (Edgeware-only) must be loaded to proceed
      const chain = app.chain as Substrate;
      if (!chain.democracy.initialized || !chain.council.initialized || !chain.democracyProposals.initialized
          || (!chain.signaling.disabled && !chain.signaling.initialized)) {
        if (!chain.democracy.initializing) loadCmd();
        return m(PageLoading, {
          message: 'Connecting to chain (may take up to 10s)...',
          title: 'Proposals',
          showNewProposalButton: true,
        });
      }
    }
    // active proposals
    const activeDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => !p.completed);
    const activeCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => !p.completed);
    const activeSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware)
      && (app.chain as Edgeware).signaling.store.getAll()
        .filter((p) => !p.completed).sort((p1, p2) => p1.getVotes().length - p2.getVotes().length);
    const activeCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => !p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const activeMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => !p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);
    const activeMarlinProposals = onMarlin
      && (app.chain as Marlin).governance.store.getAll().filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const activeProposalContent = !activeDemocracyProposals?.length
      && !activeCouncilProposals?.length
      && !activeSignalingProposals?.length
      && !activeCosmosProposals?.length
      && !activeMolochProposals?.length
      && !activeMarlinProposals?.length
      ? [ m('.no-proposals', 'None') ]
      : (activeDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((activeCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeSignalingProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((activeMarlinProposals || []).map((proposal) => m(ProposalRow, { proposal })));

    // inactive proposals
    const inactiveDemocracyProposals = onSubstrate
      && (app.chain as Substrate).democracyProposals.store.getAll().filter((p) => p.completed);
    const inactiveCouncilProposals = onSubstrate
      && (app.chain as Substrate).council.store.getAll().filter((p) => p.completed);
    const inactiveSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware)
      && (app.chain as Edgeware).signaling.store.getAll()
        .filter((p) => p.completed).sort((p1, p2) => p1.getVotes().length - p2.getVotes().length);
    const inactiveCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK)
      && (app.chain as Cosmos).governance.store.getAll()
        .filter((p) => p.completed).sort((a, b) => +b.identifier - +a.identifier);
    const inactiveMolochProposals = onMoloch
      && (app.chain as Moloch).governance.store.getAll().filter((p) => p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);
    const inactiveMarlinProposals = onMarlin
      && (app.chain as Marlin).governance.store.getAll().filter((p) => p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const inactiveProposalContent = !inactiveDemocracyProposals?.length
      && !inactiveCouncilProposals?.length
      && !inactiveSignalingProposals?.length
      && !inactiveCosmosProposals?.length
      && !inactiveMolochProposals?.length
      && !inactiveMarlinProposals?.length
      ? [ m('.no-proposals', 'None') ]
      : (inactiveDemocracyProposals || []).map((proposal) => m(ProposalRow, { proposal }))
        .concat((inactiveCouncilProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveSignalingProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveCosmosProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveMolochProposals || []).map((proposal) => m(ProposalRow, { proposal })))
        .concat((inactiveMarlinProposals || []).map((proposal) => m(ProposalRow, { proposal })));


    // XXX: display these
    const visibleTechnicalCommitteeProposals = app.chain
      && (app.chain.class === ChainClass.Kusama || app.chain.class === ChainClass.Polkadot)
      && (app.chain as Substrate).technicalCommittee.store.getAll();

    return m(Sublayout, {
      class: 'ProposalsPage',
      title: 'Proposals',
      showNewProposalButton: true,
    }, [
      onSubstrate && m(SubstrateProposalStats),
      onMarlin && m(MarlinProposalStats),
      m(Listing, {
        content: activeProposalContent,
        columnHeaders: ['Active Proposals', 'Comments', 'Likes', 'Updated'],
        rightColSpacing: [4, 4, 4]
      }),
      m(Listing, {
        content: inactiveProposalContent,
        columnHeaders: ['Inactive Proposals', 'Comments', 'Likes', 'Updated'],
        rightColSpacing: [4, 4, 4]
      }),
    ]);
  }
};

export default ProposalsPage;
