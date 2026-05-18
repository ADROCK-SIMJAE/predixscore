// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PredixScoreRegistry
/// @notice 군중심리에 휘둘리지 않은 개인 예측을 위변조 불가능하게 기록.
///         commit 단계에선 해시만 onchain (서버·다른 유저도 내용 모름).
///         시장 종료 후 reveal 로 검증.
///         가스 대납을 위해 `user` 를 명시적 파라미터로 받는다 (blockpick 패턴).
contract PredixScoreRegistry {
    struct Commit {
        address user;
        bytes32 hash;
        bytes32 marketRef;
        uint64 committedAt;
        uint64 revealAfter;
        bool revealed;
    }

    struct Reveal {
        uint8 outcomeIndex;
        uint128 stakeAmount;
        uint128 entryPrice;
        bytes32 salt;
    }

    uint256 public nextId;
    mapping(uint256 => Commit) public commits;
    mapping(uint256 => Reveal) public reveals;
    mapping(address => uint256[]) private _userCommits;
    mapping(bytes32 => uint256[]) private _marketCommits;

    event Committed(
        uint256 indexed id,
        address indexed user,
        bytes32 indexed marketRef,
        bytes32 hash,
        uint64 committedAt,
        uint64 revealAfter,
        address sponsor
    );

    event Revealed(
        uint256 indexed id,
        address indexed user,
        uint8 outcomeIndex,
        uint128 stakeAmount,
        uint128 entryPrice,
        address sponsor
    );

    error RevealInPast();
    error ZeroUser();
    error AlreadyRevealed();
    error TooEarly();
    error HashMismatch();
    error NoCommit();

    /// @notice 예측 hash 를 onchain 에 기록. `user` 는 호출자(sponsor)와 달라도 됨.
    /// @param user         예측 소유자 주소 (가스를 대납받는 유저).
    /// @param hash         keccak256(abi.encode(user, marketRef, outcomeIndex, stakeAmount, entryPrice, salt))
    /// @param marketRef    keccak256(abi.encode(eventSlug, marketSlug))
    /// @param revealAfter  시장 resolution 시각 (unix seconds). 그 이전엔 reveal 불가.
    function commit(address user, bytes32 hash, bytes32 marketRef, uint64 revealAfter)
        external
        returns (uint256 id)
    {
        if (user == address(0)) revert ZeroUser();
        if (revealAfter <= block.timestamp) revert RevealInPast();

        id = nextId++;
        commits[id] = Commit({
            user: user,
            hash: hash,
            marketRef: marketRef,
            committedAt: uint64(block.timestamp),
            revealAfter: revealAfter,
            revealed: false
        });
        _userCommits[user].push(id);
        _marketCommits[marketRef].push(id);

        emit Committed(id, user, marketRef, hash, uint64(block.timestamp), revealAfter, msg.sender);
    }

    /// @notice 시장 종료 후 commit 평문 공개 + 해시 검증.
    ///         msg.sender 검사 없음 — 해시 일치만으로 무결성 보장 (sponsor reveal 허용).
    function reveal(
        uint256 id,
        uint8 outcomeIndex,
        uint128 stakeAmount,
        uint128 entryPrice,
        bytes32 salt
    ) external {
        Commit storage c = commits[id];
        if (c.user == address(0)) revert NoCommit();
        if (c.revealed) revert AlreadyRevealed();
        if (block.timestamp < c.revealAfter) revert TooEarly();

        bytes32 expected = keccak256(
            abi.encode(c.user, c.marketRef, outcomeIndex, stakeAmount, entryPrice, salt)
        );
        if (expected != c.hash) revert HashMismatch();

        c.revealed = true;
        reveals[id] = Reveal({
            outcomeIndex: outcomeIndex,
            stakeAmount: stakeAmount,
            entryPrice: entryPrice,
            salt: salt
        });

        emit Revealed(id, c.user, outcomeIndex, stakeAmount, entryPrice, msg.sender);
    }

    /// @notice 특정 유저의 모든 commit id 목록.
    function userCommitIds(address user) external view returns (uint256[] memory) {
        return _userCommits[user];
    }

    /// @notice 특정 시장의 모든 commit id 목록.
    function marketCommitIds(bytes32 marketRef) external view returns (uint256[] memory) {
        return _marketCommits[marketRef];
    }

    /// @notice 해시 계산 헬퍼 (offchain 에서 동일하게 만들 수 있도록 reference).
    function predictionHash(
        address user,
        bytes32 marketRef,
        uint8 outcomeIndex,
        uint128 stakeAmount,
        uint128 entryPrice,
        bytes32 salt
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(user, marketRef, outcomeIndex, stakeAmount, entryPrice, salt));
    }

    /// @notice marketRef 계산 헬퍼.
    function marketRef(string calldata eventSlug, string calldata marketSlug)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(eventSlug, marketSlug));
    }
}
