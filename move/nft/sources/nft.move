module nft::nft {
    use sui::url::{Self, Url};
    use std::string;
    use sui::event;

    /// An NFT owned by `owner` with `name`, `description`, and `url` metadata
   public struct NFT has key, store {
        id: UID,
        name: string::String,
        description: string::String,
        url: Url,
        creator: address,
    }

    // ===== Events =====
   public struct NFTMinted has copy, drop {
        // The Object ID of the NFT
        object_id: ID,
        // The creator of the NFT
        creator: address,
        // The name of the NFT
        name: string::String,
    }


    /// Create a new NFT
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            creator: tx_context::sender(ctx),
        };

        // emit minted event
        event::emit(NFTMinted {
            object_id: object::uid_to_inner(&nft.id),
            creator: nft.creator,
            name: nft.name,
        });

        // mint sand sent nft to caller
        let recipient: address = tx_context::sender(ctx);

        // transfer nft to caller
        transfer::public_transfer(nft, recipient); 
    }

    /// Transfer an NFT to a recipient
    public fun transfer(
        nft: NFT,
        recipient: address,
    ) {
        transfer::public_transfer(nft, recipient);
    }

    /// Get the NFT's name
    public fun name(nft: &NFT): &string::String {
        &nft.name
    }

    /// Get the NFT's description
    public fun description(nft: &NFT): &string::String {
        &nft.description
    }

    /// Get the NFT's URL
    public fun url(nft: &NFT): &Url {
        &nft.url
    }

    /// Get the NFT's creator
    public fun creator(nft: &NFT): address {
        nft.creator
    }
}
