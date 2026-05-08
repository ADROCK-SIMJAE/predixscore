// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PredixScoreRegistry} from "../src/PredixScoreRegistry.sol";

contract DeployRegistry is Script {
    function run() external returns (PredixScoreRegistry registry) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        registry = new PredixScoreRegistry();
        vm.stopBroadcast();

        console2.log("PredixScoreRegistry deployed at:", address(registry));
    }
}
