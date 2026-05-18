// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredixScoreRegistry} from "../src/PredixScoreRegistry.sol";

contract PredixScoreRegistryTest is Test {
    PredixScoreRegistry registry;
    address sponsor = address(0x59005); // gas payer
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

    function test_sponsoredCommitAndReveal() public {
        bytes32 salt = keccak256("alice-salt-1");
        uint8 outcome = 0;
        uint128 stake = 25_000_000;
        uint128 price = 0.42e18;
        bytes32 h = _hash(alice, outcome, stake, price, salt);

        // sponsor가 alice 대신 commit 제출
        vm.prank(sponsor);
        uint256 id = registry.commit(alice, h, marketRef, revealAfter);
        assertEq(id, 0);

        // commit 소유자는 alice (sponsor 아님)
        (address user,,,,,) = registry.commits(id);
        assertEq(user, alice);

        // 너무 빠른 reveal 차단
        vm.prank(sponsor);
        vm.expectRevert(PredixScoreRegistry.TooEarly.selector);
        registry.reveal(id, outcome, stake, price, salt);

        // 시장 종료 후 sponsor가 reveal도 대행
        vm.warp(revealAfter + 1);
        vm.prank(sponsor);
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

        vm.prank(sponsor);
        uint256 id = registry.commit(alice, h, marketRef, revealAfter);

        vm.warp(revealAfter + 1);
        vm.prank(sponsor);
        vm.expectRevert(PredixScoreRegistry.HashMismatch.selector);
        registry.reveal(id, 1, 100, 0.5e18, salt);
    }

    function test_commit_rejectsZeroUser() public {
        bytes32 h = bytes32(uint256(1));
        vm.prank(sponsor);
        vm.expectRevert(PredixScoreRegistry.ZeroUser.selector);
        registry.commit(address(0), h, marketRef, revealAfter);
    }

    function test_reveal_doubleRejected() public {
        bytes32 salt = keccak256("alice-salt-4");
        uint8 outcome = 1;
        uint128 stake = 10;
        uint128 price = 0.5e18;
        bytes32 h = _hash(alice, outcome, stake, price, salt);

        vm.prank(sponsor);
        uint256 id = registry.commit(alice, h, marketRef, revealAfter);

        vm.warp(revealAfter + 1);
        vm.prank(sponsor);
        registry.reveal(id, outcome, stake, price, salt);

        vm.prank(sponsor);
        vm.expectRevert(PredixScoreRegistry.AlreadyRevealed.selector);
        registry.reveal(id, outcome, stake, price, salt);
    }

    function test_commit_rejectsRevealInPast() public {
        bytes32 h = bytes32(uint256(1));
        vm.prank(sponsor);
        vm.expectRevert(PredixScoreRegistry.RevealInPast.selector);
        registry.commit(alice, h, marketRef, uint64(block.timestamp));
    }

    function test_indexingAcrossUsers() public {
        bytes32 h1 = _hash(alice, 0, 1, 0.3e18, "s1");
        bytes32 h2 = _hash(alice, 1, 1, 0.7e18, "s2");
        bytes32 h3 = _hash(bob, 0, 1, 0.4e18, "s3");

        vm.prank(sponsor);
        registry.commit(alice, h1, marketRef, revealAfter);
        vm.prank(sponsor);
        registry.commit(alice, h2, marketRef, revealAfter);
        vm.prank(sponsor);
        registry.commit(bob, h3, marketRef, revealAfter);

        uint256[] memory aliceIds = registry.userCommitIds(alice);
        uint256[] memory bobIds = registry.userCommitIds(bob);
        uint256[] memory marketIds = registry.marketCommitIds(marketRef);

        assertEq(aliceIds.length, 2);
        assertEq(bobIds.length, 1);
        assertEq(marketIds.length, 3);
    }
}
