/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/meinkraft.json`.
 */
export type Meinkraft = {
  "address": "A8qoTZrfzgBCPADBwGQJxva9ymsUkYEnSXXtUik7HvoQ",
  "metadata": {
    "name": "meinkraft",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "attack",
      "docs": [
        "Record an attack event (player hits an entity).",
        "Each swing is one tx on the ER."
      ],
      "discriminator": [
        197,
        26,
        63,
        242,
        77,
        247,
        101,
        119
      ],
      "accounts": [
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "docs": [
            "Session token allows a delegated key to sign on behalf of the player."
          ],
          "optional": true
        }
      ],
      "args": [
        {
          "name": "targetType",
          "type": "string"
        },
        {
          "name": "damage",
          "type": "u8"
        }
      ]
    },
    {
      "name": "commitSession",
      "docs": [
        "Manual commit — persists current ER state to the base layer mid-session",
        "(optional checkpoint, does NOT end the session or undelegate)."
      ],
      "discriminator": [
        75,
        2,
        56,
        144,
        89,
        208,
        173,
        167
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "docs": [
            "Seeds: [b\"mint_authority\"]"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateSession",
      "docs": [
        "Delegate the GameSession PDA to the MagicBlock Ephemeral Rollup.",
        "Must be called on the BASE LAYER before starting a game session.",
        "The `#[delegate]` macro injects the delegation infrastructure accounts."
      ],
      "discriminator": [
        82,
        83,
        119,
        119,
        196,
        219,
        5,
        197
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                135,
                187,
                109,
                110,
                141,
                118,
                103,
                206,
                87,
                218,
                207,
                178,
                26,
                122,
                137,
                49,
                113,
                201,
                76,
                51,
                237,
                29,
                217,
                13,
                143,
                154,
                5,
                176,
                14,
                134,
                64,
                119
              ]
            }
          }
        },
        {
          "name": "delegationRecordPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "A8qoTZrfzgBCPADBwGQJxva9ymsUkYEnSXXtUik7HvoQ"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endGame",
      "docs": [
        "End the active game session.",
        "Marks session inactive so it can be undelegated safely."
      ],
      "discriminator": [
        224,
        135,
        245,
        99,
        67,
        175,
        121,
        252
      ],
      "accounts": [
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "docs": [
            "Session token allows a delegated key to sign on behalf of the player."
          ],
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "enterGame",
      "docs": [
        "Start a game session.",
        "Resets session counters and marks session as active.",
        "Called on the ER after delegation."
      ],
      "discriminator": [
        157,
        184,
        173,
        203,
        193,
        117,
        106,
        66
      ],
      "accounts": [
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "docs": [
            "Session token allows a delegated key to sign on behalf of the player."
          ],
          "optional": true
        }
      ],
      "args": [
        {
          "name": "realm",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeProfile",
      "docs": [
        "Create the player's persistent profile.",
        "Seeds: [b\"profile\", authority]"
      ],
      "discriminator": [
        32,
        145,
        77,
        213,
        58,
        39,
        251,
        234
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "killEntity",
      "docs": [
        "Record an entity kill (animal or enemy).",
        "Called when an entity's health reaches zero."
      ],
      "discriminator": [
        169,
        200,
        135,
        58,
        71,
        150,
        207,
        238
      ],
      "accounts": [
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "docs": [
            "Session token allows a delegated key to sign on behalf of the player."
          ],
          "optional": true
        }
      ],
      "args": [
        {
          "name": "entityType",
          "type": "string"
        },
        {
          "name": "scoreReward",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placeBlock",
      "docs": [
        "Record a block placement event.",
        "Each call is one tx on the ER (cheap, fast, gasless for the player)."
      ],
      "discriminator": [
        184,
        154,
        18,
        192,
        205,
        185,
        38,
        139
      ],
      "accounts": [
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "docs": [
            "Session token allows a delegated key to sign on behalf of the player."
          ],
          "optional": true
        }
      ],
      "args": [
        {
          "name": "blockType",
          "type": "string"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "undelegateSession",
      "docs": [
        "Undelegate the GameSession PDA from the ER and commit final state.",
        "Must be called on the BASE LAYER to settle scores back to base."
      ],
      "discriminator": [
        110,
        234,
        80,
        245,
        77,
        79,
        58,
        116
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "docs": [
            "Seeds: [b\"mint_authority\"]"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameSession",
      "discriminator": [
        150,
        116,
        20,
        197,
        205,
        121,
        220,
        240
      ]
    },
    {
      "name": "playerProfile",
      "discriminator": [
        82,
        226,
        99,
        87,
        164,
        130,
        181,
        80
      ]
    },
    {
      "name": "sessionToken",
      "discriminator": [
        233,
        4,
        115,
        14,
        46,
        21,
        1,
        15
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "noActiveSession",
      "msg": "No active session — call enter_game first"
    },
    {
      "code": 6001,
      "name": "sessionAlreadyActive",
      "msg": "Session already active — call end_game before starting a new one"
    },
    {
      "code": 6002,
      "name": "sessionStillActive",
      "msg": "Session is still active — call end_game before undelegating"
    },
    {
      "code": 6003,
      "name": "invalidRealm",
      "msg": "Invalid realm name"
    },
    {
      "code": 6004,
      "name": "invalidAuth",
      "msg": "Invalid authentication"
    }
  ],
  "types": [
    {
      "name": "gameSession",
      "docs": [
        "Ephemeral session state — delegated to ER for the duration of a game.",
        "Settled back to base layer via commit_and_undelegate after each session."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Owner of this session."
            ],
            "type": "pubkey"
          },
          {
            "name": "realm",
            "docs": [
              "Active realm (\"Jungle\" | \"Desert\" | \"Snow\")."
            ],
            "type": "string"
          },
          {
            "name": "blocksPlaced",
            "docs": [
              "Blocks placed this session."
            ],
            "type": "u32"
          },
          {
            "name": "attacks",
            "docs": [
              "Attacks made this session."
            ],
            "type": "u32"
          },
          {
            "name": "kills",
            "docs": [
              "Entities killed this session."
            ],
            "type": "u32"
          },
          {
            "name": "score",
            "docs": [
              "Score accumulated this session."
            ],
            "type": "u64"
          },
          {
            "name": "pendingMints",
            "docs": [
              "Mints to be performed during settlement."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "pendingMint"
                }
              }
            }
          },
          {
            "name": "active",
            "docs": [
              "Whether a game is currently in progress."
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "pendingMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "count",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "docs": [
        "Persistent player profile — lives on the base layer forever."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The wallet that owns this profile."
            ],
            "type": "pubkey"
          },
          {
            "name": "totalBlocksPlaced",
            "docs": [
              "Cumulative blocks placed across all sessions."
            ],
            "type": "u64"
          },
          {
            "name": "totalAttacks",
            "docs": [
              "Cumulative attacks across all sessions."
            ],
            "type": "u64"
          },
          {
            "name": "totalKills",
            "docs": [
              "Cumulative entity kills across all sessions."
            ],
            "type": "u64"
          },
          {
            "name": "totalScore",
            "docs": [
              "Cumulative score across all sessions."
            ],
            "type": "u64"
          },
          {
            "name": "gamesPlayed",
            "docs": [
              "Number of completed games."
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "sessionToken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "targetProgram",
            "type": "pubkey"
          },
          {
            "name": "sessionSigner",
            "type": "pubkey"
          },
          {
            "name": "validUntil",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
