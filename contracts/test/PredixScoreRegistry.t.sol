// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredixScoreRegistry} from "../src/PredixScoreRegistry.sol";

contract PredixScoreRegistryTest is Test {
    PredixScoreRegistry registry;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    bytes32 marketRef;
    uint64 revealAfter;

    function setUp() public {
        registry = new PredixScoreRegistry();
        marketRef = registry.marketRef("2026-fifa-world-cup-winner", "iraq-wins");
        revealAfter = uint64(block.timestamp + 30 days);
    }

    function _hash(
        address user,
        uint8 outcome,
        uint128 stake,
        uint128 price,
        bytes32 salt
    ) internal view returns (bytes32) {
        return registry.predictionHash(user, marketRef, outcome, stake, price, salt);
    }

    function test_commit_and_reveal() public {
        bytes32 salt = keccak256("alice-salt-1");
        uint8 outcome = 0;
        uint128 stake = 25_000_000; // 25 USDC
        uint128 price = 0.42e18;
        bytes32 h = _hash(alice, outcome, stake, price, salt);

        vm.prank(alice);
        uint256 id = registry.commit(h, marketRef, revealAfter);
        assertEq(id, 0);

        // 너무 빠른 reveal 차단
        vm.prank(alice);
        vm.expectRevert(PredixScoreRegistry.TooEarly.selector);
        registry.reveal(id, outcome, stake, price, salt);

        // 시장 종료 후 정상 reveal
        vm.warp(revealAfter + 1);
        vm.prank(alice);
        registry.reveal(id, outcome, stake, price, salt);

        (uint8 ro, uint128 rs, uint128 rp, bytes32 rsalt) = registry.reveals(id);
        assertEq(ro, outcome);
        assertEq(rs, stake);
        assertEq(rp, price);
        assertEq(rsalt, salt);
    }

    function test_reveal_rejectsHashMismatch() public {
        bytes32 salt = keccak256("alice-salt-2");
        bytes32 h = _hash(alice, 0, 100, 0.5e18, salt);

        vm.prank(alice);
        uint256 id = registry.commit(h, marketRef, revealAfter);

        vm.warp(revealAfter + 1);
        vm.prank(alice);
        vm.expectRevert(PredixScoreRegistry.HashMismatch.selector);
        // 다른 outcome 으로 reveal 시도 → 거절
        registry.reveal(id, 1, 100, 0.5e18, salt);
    }

    function test_reveal_rejectsNotOwner() public {
        bytes32 salt = keccak256("alice-salt-3");
        bytes32 h = _hash(alice, 0, 100, 0.5e18, salt);

        vm.prank(alice);
        uint256 id = registry.commit(h, marketRef, revealAfter);

        vm.warp(revealAfter + 1);
        vm.prank(bob);
        vm.expectRevert(PredixScoreRegistry.NotOwner.selector);
        registry.reveal(id, 0, 100, 0.5e18, salt);
    }

    function test_reveal_doubleRejected() public {
        bytes32 salt = keccak256("alice-salt-4");
        uint8 outcome = 1;
        uint128 stake = 10;
        uint128 price = 0.5e18;
        bytes32 h = _hash(alice, outcome, stake, price, salt);

        vm.prank(alice);
        uint256 id = registry.commit(h, marketRef, revealAfter);

        vm.warp(revealAfter + 1);
        vm.prank(alice);
        registry.reveal(id, outcome, stake, price, salt);

        vm.prank(alice);
        vm.expectRevert(PredixScoreRegistry.AlreadyRevealed.selector);
        registry.reveal(id, outcome, stake, price, salt);
    }

    function test_commit_rejectsRevealInPast() public {
        bytes32 h = bytes32(uint256(1));
        vm.prank(alice);
        vm.expectRevert(PredixScoreRegistry.RevealInPast.selector);
        registry.commit(h, marketRef, uint64(block.timestamp));
    }

    function test_indexing() public {
        // alice 가 같은 시장에 두 번, bob 도 한 번
        bytes32 h1 = _hash(alice, 0, 1, 0.3e18, "s1");
        bytes32 h2 = _hash(alice, 1, 1, 0.7e18, "s2");
        bytes32 h3 = _hash(bob, 0, 1, 0.4e18, "s3");

        vm.prank(alice);
        registry.commit(h1, marketRef, revealAfter);
        vm.prank(alice);
        registry.commit(h2, marketRef, revealAfter);
        vm.prank(bob);
        registry.commit(h3, marketRef, revealAfter);

        uint256[] memory aliceIds = registry.userCommitIds(alice);
        uint256[] memory bobIds = registry.userCommitIds(bob);
        uint256[] memory marketIds = registry.marketCommitIds(marketRef);

        assertEq(aliceIds.length, 2);
        assertEq(bobIds.length, 1);
        assertEq(marketIds.length, 3);
    }
}
