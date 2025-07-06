// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ContactManager {
    struct User {
        string nom;
        string prenom;
        bool isInitialized;
        uint256 createdAt;
    }
    
    struct Contact {
        uint256 id;
        string nom;
        string prenom;
        address wallet;
        string birthdate;  // optionnel
        string mail;       // optionnel
        string phone;      // optionnel
        bool votingRight;
        bool exists;
    }

    mapping(address => User) private users;
    mapping(address => Contact[]) private userContacts;
    mapping(address => uint256) private nextContactId;
    
    // Mapping pour retrouver les owners des contacts avec droits de vote
    // contactWallet => array of owner addresses
    mapping(address => address[]) private contactOwners;
    
    // Système de vote pour déclarer un owner décédé
    struct DeathVote {
        address owner;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVoters;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice; // true = pour, false = contre
        bool isActive;
        uint256 createdAt;
    }
    
    // Mapping pour les votes de décès: ownerAddress => DeathVote
    mapping(address => DeathVote) private deathVotes;
    // Mapping pour marquer les owners décédés
    mapping(address => bool) private declaredDead;

    event UserInitialized(address indexed user, string nom, string prenom);
    event ContactAdded(address indexed user, uint256 indexed contactId, bool votingRight);
    event ContactRemoved(address indexed user, uint256 indexed contactId);
    event VotingRightUpdated(address indexed user, uint256 indexed contactId, bool votingRight);
    event DeathVoteStarted(address indexed owner, address indexed initiator, uint256 totalVoters);
    event DeathVoteCast(address indexed owner, address indexed voter, bool voteFor);
    event OwnerDeclaredDead(address indexed owner, uint256 votesFor, uint256 votesAgainst);
    event VaultsSharedOnDeath(address indexed owner, uint256 vaultsShared, uint256 contactsNotified);

    // -------------------- User Management --------------------
    
    function initializeUser(string memory _nom, string memory _prenom) external {
        require(!users[msg.sender].isInitialized, "User already initialized");
        require(bytes(_nom).length > 0, "Nom is required");
        require(bytes(_prenom).length > 0, "Prenom is required");
        
        users[msg.sender] = User({
            nom: _nom,
            prenom: _prenom,
            isInitialized: true,
            createdAt: block.timestamp
        });
        
        emit UserInitialized(msg.sender, _nom, _prenom);
    }
    
    function isUserInitialized() external view returns (bool) {
        return users[msg.sender].isInitialized;
    }
    
    function getUserInfo() external view returns (string memory nom, string memory prenom, uint256 createdAt) {
        require(users[msg.sender].isInitialized, "User not initialized");
        User memory user = users[msg.sender];
        return (user.nom, user.prenom, user.createdAt);
    }
    
    function updateUserInfo(string memory _nom, string memory _prenom) external {
        require(users[msg.sender].isInitialized, "User not initialized");
        require(bytes(_nom).length > 0, "Nom is required");
        require(bytes(_prenom).length > 0, "Prenom is required");
        
        users[msg.sender].nom = _nom;
        users[msg.sender].prenom = _prenom;
    }
    
    // -------------------- Owner Visibility for Contacts with Voting Rights --------------------
    
    function getMyOwners() external view returns (address[] memory) {
        return contactOwners[msg.sender];
    }
    
    function getOwnerInfo(address _ownerAddress) external view returns (string memory nom, string memory prenom, bool isInitialized) {
        User memory owner = users[_ownerAddress];
        return (owner.nom, owner.prenom, owner.isInitialized);
    }
    
    function hasVotingRightFromOwner(address _ownerAddress) external view returns (bool) {
        // Vérifier si l'owner a ajouté le msg.sender comme contact avec droits de vote
        for (uint256 i = 0; i < contactOwners[msg.sender].length; i++) {
            if (contactOwners[msg.sender][i] == _ownerAddress) {
                return true;
            }
        }
        return false;
    }

    // -------------------- Contact Management --------------------

    function addContact(
        string memory _nom,
        string memory _prenom,
        address _wallet,
        string memory _birthdate,
        string memory _mail,
        string memory _phone,
        bool _votingRight
    ) external {
        uint256 contactId = nextContactId[msg.sender];
        
        Contact memory newContact = Contact({
            id: contactId,
            nom: _nom,
            prenom: _prenom,
            wallet: _wallet,
            birthdate: _birthdate,
            mail: _mail,
            phone: _phone,
            votingRight: _votingRight,
            exists: true
        });

        userContacts[msg.sender].push(newContact);
        nextContactId[msg.sender]++;

        // Si le contact a des droits de vote, l'enregistrer dans le mapping des owners
        if (_votingRight) {
            // Vérifier si l'owner n'est pas déjà enregistré pour ce contact
            bool alreadyExists = false;
            for (uint256 i = 0; i < contactOwners[_wallet].length; i++) {
                if (contactOwners[_wallet][i] == msg.sender) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                contactOwners[_wallet].push(msg.sender);
            }
        }

        emit ContactAdded(msg.sender, contactId, _votingRight);
    }

    function removeContact(uint256 _contactId) external {
        Contact[] storage contacts = userContacts[msg.sender];
        
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].id == _contactId && contacts[i].exists) {
                address contactWallet = contacts[i].wallet;
                bool hadVotingRight = contacts[i].votingRight;
                
                contacts[i].exists = false;
                
                // Si le contact avait des droits de vote, le retirer du mapping des owners
                if (hadVotingRight) {
                    for (uint256 j = 0; j < contactOwners[contactWallet].length; j++) {
                        if (contactOwners[contactWallet][j] == msg.sender) {
                            contactOwners[contactWallet][j] = contactOwners[contactWallet][contactOwners[contactWallet].length - 1];
                            contactOwners[contactWallet].pop();
                            break;
                        }
                    }
                }
                
                emit ContactRemoved(msg.sender, _contactId);
                return;
            }
        }
        
        revert("Contact not found");
    }

    function getContacts() external view returns (Contact[] memory) {
        uint256 totalContacts = userContacts[msg.sender].length;
        uint256 activeContacts = 0;

        // Compter les contacts actifs
        for (uint256 i = 0; i < totalContacts; i++) {
            if (userContacts[msg.sender][i].exists) {
                activeContacts++;
            }
        }

        // Créer un tableau pour les contacts actifs
        Contact[] memory activeContactList = new Contact[](activeContacts);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalContacts; i++) {
            if (userContacts[msg.sender][i].exists) {
                activeContactList[currentIndex] = userContacts[msg.sender][i];
                currentIndex++;
            }
        }

        return activeContactList;
    }

    function getContactCount() external view returns (uint256) {
        uint256 totalContacts = userContacts[msg.sender].length;
        uint256 activeContacts = 0;

        for (uint256 i = 0; i < totalContacts; i++) {
            if (userContacts[msg.sender][i].exists) {
                activeContacts++;
            }
        }

        return activeContacts;
    }

    function updateVotingRight(uint256 _contactId, bool _canVote) external {
        Contact[] storage contacts = userContacts[msg.sender];
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].id == _contactId && contacts[i].exists) {
                address contactWallet = contacts[i].wallet;
                bool previousVotingRight = contacts[i].votingRight;
                
                contacts[i].votingRight = _canVote;
                
                // Gérer l'ajout/suppression dans le mapping des owners
                if (_canVote && !previousVotingRight) {
                    // Ajout des droits de vote - ajouter l'owner
                    bool alreadyExists = false;
                    for (uint256 j = 0; j < contactOwners[contactWallet].length; j++) {
                        if (contactOwners[contactWallet][j] == msg.sender) {
                            alreadyExists = true;
                            break;
                        }
                    }
                    if (!alreadyExists) {
                        contactOwners[contactWallet].push(msg.sender);
                    }
                } else if (!_canVote && previousVotingRight) {
                    // Suppression des droits de vote - retirer l'owner
                    for (uint256 j = 0; j < contactOwners[contactWallet].length; j++) {
                        if (contactOwners[contactWallet][j] == msg.sender) {
                            contactOwners[contactWallet][j] = contactOwners[contactWallet][contactOwners[contactWallet].length - 1];
                            contactOwners[contactWallet].pop();
                            break;
                        }
                    }
                }
                
                emit VotingRightUpdated(msg.sender, _contactId, _canVote);
                return;
            }
        }
        revert("Contact not found");
    }

    // -------------------- Vault Management --------------------
    struct VaultFile {
        uint256 id;
        string name; // only name stored, other metadata off-chain/default
        bool exists;
    }

    struct Vault {
        uint256 id;
        string name;
        string description;
        uint256[] contactIds; // list of contact ids linked to this vault
        VaultFile[] files;
        bool exists;
    }

    mapping(address => Vault[]) private userVaults;
    mapping(address => uint256) private nextVaultId;
    
    // Shared access: vaultOwner => vaultId => sharedWith => hasAccess
    mapping(address => mapping(uint256 => mapping(address => bool))) private vaultAccess;
    // Track shared vaults for each user: user => array of (owner, vaultId)
    struct SharedVaultRef {
        address owner;
        uint256 vaultId;
    }
    mapping(address => SharedVaultRef[]) private sharedWithUser;

    event VaultCreated(address indexed user, uint256 indexed vaultId);
    event VaultDeleted(address indexed user, uint256 indexed vaultId);
    event ContactAddedToVault(address indexed user, uint256 indexed vaultId, uint256 contactId);
    event ContactRemovedFromVault(address indexed user, uint256 indexed vaultId, uint256 contactId);
    event VaultFileAdded(address indexed user, uint256 indexed vaultId, uint256 fileId);
    event VaultFileRemoved(address indexed user, uint256 indexed vaultId, uint256 fileId);
    event VaultShared(address indexed owner, uint256 indexed vaultId, address indexed sharedWith);
    event VaultUnshared(address indexed owner, uint256 indexed vaultId, address indexed sharedWith);

    // mapping for next file id per user->vaultId
    mapping(address => mapping(uint256 => uint256)) private nextFileId;

    function _contactBelongs(address _user, uint256 _contactId) internal view returns (bool) {
        Contact[] storage contacts = userContacts[_user];
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].id == _contactId && contacts[i].exists) {
                return true;
            }
        }
        return false;
    }

    function createVault(string memory _name, string memory _description, uint256[] memory _contactIds, string[] memory _fileNames) external {
        // validate contacts belong to sender
        for (uint256 i = 0; i < _contactIds.length; i++) {
            require(_contactBelongs(msg.sender, _contactIds[i]), "Invalid contactId");
        }

        uint256 vaultId = nextVaultId[msg.sender];
        Vault storage vault = userVaults[msg.sender].push();
        vault.id = vaultId;
        vault.name = _name;
        vault.description = _description;
        vault.exists = true;

        // add contacts
        for (uint256 i = 0; i < _contactIds.length; i++) {
            vault.contactIds.push(_contactIds[i]);
        }

        // add initial files
        for (uint256 i = 0; i < _fileNames.length; i++) {
            uint256 fileId = nextFileId[msg.sender][vaultId]++;
            vault.files.push(VaultFile({ id: fileId, name: _fileNames[i], exists: true }));
            emit VaultFileAdded(msg.sender, vaultId, fileId);
        }

        nextVaultId[msg.sender]++;

        emit VaultCreated(msg.sender, vaultId);
    }

    function addContactToVault(uint256 _vaultId, uint256 _contactId) external {
        require(_contactBelongs(msg.sender, _contactId), "Invalid contactId");
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                // check not already added
                for (uint256 j = 0; j < vaults[i].contactIds.length; j++) {
                    require(vaults[i].contactIds[j] != _contactId, "Already added");
                }
                vaults[i].contactIds.push(_contactId);
                emit ContactAddedToVault(msg.sender, _vaultId, _contactId);
                return;
            }
        }
        revert("Vault not found");
    }

    function removeContactFromVault(uint256 _vaultId, uint256 _contactId) external {
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                uint256 len = vaults[i].contactIds.length;
                for (uint256 j = 0; j < len; j++) {
                    if (vaults[i].contactIds[j] == _contactId) {
                        vaults[i].contactIds[j] = vaults[i].contactIds[len - 1];
                        vaults[i].contactIds.pop();
                        emit ContactRemovedFromVault(msg.sender, _vaultId, _contactId);
                        return;
                    }
                }
            }
        }
        revert("Vault/contact mismatch");
    }

    function deleteVault(uint256 _vaultId) external {
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                vaults[i].exists = false;
                emit VaultDeleted(msg.sender, _vaultId);
                return;
            }
        }
        revert("Vault not found");
    }

    function getVaults() external view returns (Vault[] memory) {
        return userVaults[msg.sender];
    }

    function getVaultIdsForContact(uint256 _contactId) external view returns (uint256[] memory) {
        Vault[] storage vaults = userVaults[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].exists) {
                for (uint256 j = 0; j < vaults[i].contactIds.length; j++) {
                    if (vaults[i].contactIds[j] == _contactId) {
                        count++;
                        break;
                    }
                }
            }
        }

        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].exists) {
                for (uint256 j = 0; j < vaults[i].contactIds.length; j++) {
                    if (vaults[i].contactIds[j] == _contactId) {
                        ids[idx] = vaults[i].id;
                        idx++;
                        break;
                    }
                }
            }
        }
        return ids;
    }

    function addFileToVault(uint256 _vaultId, string memory _name) external {
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                uint256 fileId = nextFileId[msg.sender][_vaultId]++;
                vaults[i].files.push(VaultFile({ id: fileId, name: _name, exists: true }));
                emit VaultFileAdded(msg.sender, _vaultId, fileId);
                return;
            }
        }
        revert("Vault not found");
    }

    function removeFileFromVault(uint256 _vaultId, uint256 _fileId) external {
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                VaultFile[] storage files = vaults[i].files;
                for (uint256 j = 0; j < files.length; j++) {
                    if (files[j].id == _fileId && files[j].exists) {
                        files[j].exists = false;
                        emit VaultFileRemoved(msg.sender, _vaultId, _fileId);
                        return;
                    }
                }
            }
        }
        revert("File not found");
    }

    function getVaultFiles(uint256 _vaultId) external view returns (VaultFile[] memory) {
        Vault[] storage vaults = userVaults[msg.sender];
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                // count active files
                uint256 active = 0;
                for (uint256 j = 0; j < vaults[i].files.length; j++) {
                    if (vaults[i].files[j].exists) active++;
                }
                VaultFile[] memory activeFiles = new VaultFile[](active);
                uint256 idx = 0;
                for (uint256 j = 0; j < vaults[i].files.length; j++) {
                    if (vaults[i].files[j].exists) {
                        activeFiles[idx] = vaults[i].files[j];
                        idx++;
                    }
                }
                return activeFiles;
            }
        }
        return new VaultFile[](0);
    }

    // -------------------- Vault Sharing --------------------
    
    function shareVaultWithContact(uint256 _vaultId, uint256 _contactId) external {
        // Verify vault exists and belongs to sender
        Vault[] storage vaults = userVaults[msg.sender];
        bool vaultFound = false;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                vaultFound = true;
                break;
            }
        }
        require(vaultFound, "Vault not found");
        
        // Get contact wallet address
        Contact[] storage contacts = userContacts[msg.sender];
        address contactWallet = address(0);
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].id == _contactId && contacts[i].exists) {
                contactWallet = contacts[i].wallet;
                break;
            }
        }
        require(contactWallet != address(0), "Contact not found");
        
        // Check if already shared to prevent duplicates
        require(!vaultAccess[msg.sender][_vaultId][contactWallet], "Already shared with this contact");
        
        // Grant access
        vaultAccess[msg.sender][_vaultId][contactWallet] = true;
        
        // Add to shared list for the contact
        sharedWithUser[contactWallet].push(SharedVaultRef({
            owner: msg.sender,
            vaultId: _vaultId
        }));
        
        emit VaultShared(msg.sender, _vaultId, contactWallet);
    }
    
    function unshareVaultWithContact(uint256 _vaultId, uint256 _contactId) external {
        // Get contact wallet address
        Contact[] storage contacts = userContacts[msg.sender];
        address contactWallet = address(0);
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].id == _contactId && contacts[i].exists) {
                contactWallet = contacts[i].wallet;
                break;
            }
        }
        require(contactWallet != address(0), "Contact not found");
        
        // Revoke access
        vaultAccess[msg.sender][_vaultId][contactWallet] = false;
        
        // Remove from shared list
        SharedVaultRef[] storage shared = sharedWithUser[contactWallet];
        for (uint256 i = 0; i < shared.length; i++) {
            if (shared[i].owner == msg.sender && shared[i].vaultId == _vaultId) {
                shared[i] = shared[shared.length - 1];
                shared.pop();
                break;
            }
        }
        
        emit VaultUnshared(msg.sender, _vaultId, contactWallet);
    }
    
    function shareVaultWithLinkedContacts(uint256 _vaultId) external {
        // Verify vault exists and belongs to sender
        Vault[] storage vaults = userVaults[msg.sender];
        bool vaultFound = false;
        uint256 vaultIndex = 0;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                vaultFound = true;
                vaultIndex = i;
                break;
            }
        }
        require(vaultFound, "Vault not found");
        
        // Share with contacts linked to this vault
        Contact[] storage contacts = userContacts[msg.sender];
        uint256[] storage linkedContactIds = vaults[vaultIndex].contactIds;
        
        for (uint256 i = 0; i < linkedContactIds.length; i++) {
            uint256 contactId = linkedContactIds[i];
            
            // Find the contact by ID
            for (uint256 j = 0; j < contacts.length; j++) {
                if (contacts[j].id == contactId && contacts[j].exists) {
                    address contactWallet = contacts[j].wallet;
                    
                    // Only share if not already shared
                    if (!vaultAccess[msg.sender][_vaultId][contactWallet]) {
                        // Grant access
                        vaultAccess[msg.sender][_vaultId][contactWallet] = true;
                        
                        // Add to shared list for the contact
                        sharedWithUser[contactWallet].push(SharedVaultRef({
                            owner: msg.sender,
                            vaultId: _vaultId
                        }));
                        
                        emit VaultShared(msg.sender, _vaultId, contactWallet);
                    }
                    break;
                }
            }
        }
    }
    
    function getSharedVaults() external view returns (Vault[] memory) {
        SharedVaultRef[] storage refs = sharedWithUser[msg.sender];
        uint256 count = 0;
        
        // Count valid shared vaults
        for (uint256 i = 0; i < refs.length; i++) {
            if (vaultAccess[refs[i].owner][refs[i].vaultId][msg.sender]) {
                Vault[] storage ownerVaults = userVaults[refs[i].owner];
                for (uint256 j = 0; j < ownerVaults.length; j++) {
                    if (ownerVaults[j].id == refs[i].vaultId && ownerVaults[j].exists) {
                        count++;
                        break;
                    }
                }
            }
        }
        
        Vault[] memory sharedVaults = new Vault[](count);
        uint256 idx = 0;
        
        for (uint256 i = 0; i < refs.length; i++) {
            if (vaultAccess[refs[i].owner][refs[i].vaultId][msg.sender]) {
                Vault[] storage ownerVaults = userVaults[refs[i].owner];
                for (uint256 j = 0; j < ownerVaults.length; j++) {
                    if (ownerVaults[j].id == refs[i].vaultId && ownerVaults[j].exists) {
                        sharedVaults[idx] = ownerVaults[j];
                        idx++;
                        break;
                    }
                }
            }
        }
        
        return sharedVaults;
    }
    
    function hasVaultAccess(address _owner, uint256 _vaultId) external view returns (bool) {
        // Owner always has access
        if (_owner == msg.sender) return true;
        // Check shared access
        return vaultAccess[_owner][_vaultId][msg.sender];
    }
    
    function getVaultSharedWith(uint256 _vaultId) external view returns (address[] memory) {
        // Only vault owner can see who it's shared with
        Vault[] storage vaults = userVaults[msg.sender];
        bool vaultFound = false;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                vaultFound = true;
                break;
            }
        }
        require(vaultFound, "Vault not found or not owner");
        
        // Get contacts of this vault and check which ones have access
        Contact[] storage contacts = userContacts[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].exists && vaultAccess[msg.sender][_vaultId][contacts[i].wallet]) {
                count++;
            }
        }
        
        address[] memory sharedWith = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].exists && vaultAccess[msg.sender][_vaultId][contacts[i].wallet]) {
                sharedWith[idx] = contacts[i].wallet;
                idx++;
            }
        }
        
        return sharedWith;
    }
    
    function getVaultShareCount(uint256 _vaultId) external view returns (uint256) {
        // Verify vault exists and belongs to sender
        Vault[] storage vaults = userVaults[msg.sender];
        bool vaultFound = false;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].id == _vaultId && vaults[i].exists) {
                vaultFound = true;
                break;
            }
        }
        require(vaultFound, "Vault not found or not owner");
        
        // Count shared contacts
        Contact[] storage contacts = userContacts[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].exists && vaultAccess[msg.sender][_vaultId][contacts[i].wallet]) {
                count++;
            }
        }
        
        return count;
    }
    
    // -------------------- Death Vote System --------------------
    
    function initiateDeathVote(address _ownerAddress) external {
        require(users[msg.sender].isInitialized, "User not initialized");
        require(users[_ownerAddress].isInitialized, "Owner not initialized");
        require(!declaredDead[_ownerAddress], "Owner already declared dead");
        require(!deathVotes[_ownerAddress].isActive, "Death vote already active");
        
        // Vérifier que l'appelant a des droits de vote de cet owner
        bool hasVotingRight = false;
        for (uint256 i = 0; i < contactOwners[msg.sender].length; i++) {
            if (contactOwners[msg.sender][i] == _ownerAddress) {
                hasVotingRight = true;
                break;
            }
        }
        require(hasVotingRight, "No voting rights from this owner");
        
        // Compter le nombre total de contacts avec droits de vote pour cet owner
        Contact[] storage contacts = userContacts[_ownerAddress];
        uint256 totalVoters = 0;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].exists && contacts[i].votingRight) {
                totalVoters++;
            }
        }
        
        require(totalVoters > 0, "No voters available");
        
        // Initialiser le vote
        DeathVote storage vote = deathVotes[_ownerAddress];
        vote.owner = _ownerAddress;
        vote.votesFor = 0;
        vote.votesAgainst = 0;
        vote.totalVoters = totalVoters;
        vote.isActive = true;
        vote.createdAt = block.timestamp;
        
        emit DeathVoteStarted(_ownerAddress, msg.sender, totalVoters);
    }
    
    function castDeathVote(address _ownerAddress, bool _voteFor) external {
        require(users[msg.sender].isInitialized, "User not initialized");
        require(deathVotes[_ownerAddress].isActive, "No active death vote");
        require(!deathVotes[_ownerAddress].hasVoted[msg.sender], "Already voted");
        
        // Vérifier que l'appelant a des droits de vote de cet owner
        bool hasVotingRight = false;
        Contact[] storage contacts = userContacts[_ownerAddress];
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i].exists && contacts[i].votingRight && contacts[i].wallet == msg.sender) {
                hasVotingRight = true;
                break;
            }
        }
        require(hasVotingRight, "No voting rights from this owner");
        
        // Enregistrer le vote
        DeathVote storage vote = deathVotes[_ownerAddress];
        vote.hasVoted[msg.sender] = true;
        vote.voteChoice[msg.sender] = _voteFor;
        
        if (_voteFor) {
            vote.votesFor++;
        } else {
            vote.votesAgainst++;
        }
        
        emit DeathVoteCast(_ownerAddress, msg.sender, _voteFor);
        
        // Vérifier si le consensus est atteint (majorité simple)
        uint256 totalVotes = vote.votesFor + vote.votesAgainst;
        if (totalVotes == vote.totalVoters) {
            // Tous les votes sont comptés
            if (vote.votesFor > vote.votesAgainst) {
                // Majorité pour déclarer mort
                declaredDead[_ownerAddress] = true;
                vote.isActive = false;
                
                // Partager automatiquement tous les vaults avec leurs contacts liés
                _shareAllVaultsOnDeath(_ownerAddress);
                
                emit OwnerDeclaredDead(_ownerAddress, vote.votesFor, vote.votesAgainst);
            } else {
                // Majorité contre ou égalité - vote échoué
                vote.isActive = false;
            }
        }
    }
    
    function getDeathVoteStatus(address _ownerAddress) external view returns (
        bool isActive,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVoters,
        bool hasVoted,
        bool voteChoice,
        uint256 createdAt
    ) {
        DeathVote storage vote = deathVotes[_ownerAddress];
        return (
            vote.isActive,
            vote.votesFor,
            vote.votesAgainst,
            vote.totalVoters,
            vote.hasVoted[msg.sender],
            vote.voteChoice[msg.sender],
            vote.createdAt
        );
    }
    
    function isOwnerDeclaredDead(address _ownerAddress) external view returns (bool) {
        return declaredDead[_ownerAddress];
    }
    
    function canInitiateDeathVote(address _ownerAddress) external view returns (bool) {
        if (!users[msg.sender].isInitialized || !users[_ownerAddress].isInitialized) {
            return false;
        }
        if (declaredDead[_ownerAddress] || deathVotes[_ownerAddress].isActive) {
            return false;
        }
        
        // Vérifier que l'appelant a des droits de vote de cet owner
        for (uint256 i = 0; i < contactOwners[msg.sender].length; i++) {
            if (contactOwners[msg.sender][i] == _ownerAddress) {
                return true;
            }
        }
        return false;
    }
    
    // -------------------- Private Functions --------------------
    
    function _shareAllVaultsOnDeath(address _ownerAddress) private {
        Vault[] storage vaults = userVaults[_ownerAddress];
        Contact[] storage contacts = userContacts[_ownerAddress];
        
        uint256 vaultsShared = 0;
        uint256 contactsNotified = 0;
        
        // Parcourir tous les vaults du propriétaire décédé
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i].exists) {
                bool vaultHasShares = false;
                // Pour chaque vault, partager avec tous ses contacts liés
                uint256[] storage linkedContactIds = vaults[i].contactIds;
                
                for (uint256 j = 0; j < linkedContactIds.length; j++) {
                    uint256 contactId = linkedContactIds[j];
                    
                    // Trouver l'adresse wallet du contact
                    for (uint256 k = 0; k < contacts.length; k++) {
                        if (contacts[k].id == contactId && contacts[k].exists) {
                            address contactWallet = contacts[k].wallet;
                            
                            // Partager le vault seulement si pas déjà partagé
                            if (!vaultAccess[_ownerAddress][vaults[i].id][contactWallet]) {
                                // Accorder l'accès
                                vaultAccess[_ownerAddress][vaults[i].id][contactWallet] = true;
                                
                                // Ajouter à la liste des vaults partagés pour le contact
                                sharedWithUser[contactWallet].push(SharedVaultRef({
                                    owner: _ownerAddress,
                                    vaultId: vaults[i].id
                                }));
                                
                                emit VaultShared(_ownerAddress, vaults[i].id, contactWallet);
                                
                                if (!vaultHasShares) {
                                    vaultHasShares = true;
                                }
                                contactsNotified++;
                            }
                            break;
                        }
                    }
                }
                
                if (vaultHasShares) {
                    vaultsShared++;
                }
            }
        }
        
        // Émettre l'événement avec les statistiques
        emit VaultsSharedOnDeath(_ownerAddress, vaultsShared, contactsNotified);
    }
} 