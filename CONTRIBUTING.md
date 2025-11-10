# Contributing to ZeaZDev

Thank you for your interest in contributing to ZeaZDev! This document provides guidelines and best practices for contributing to the project.

---

## 🎯 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/your-feature`

### Development Setup

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/ZeaZDev-Omega.git
cd ZeaZDev-Omega

# 2. Add upstream remote
git remote add upstream https://github.com/ZeaZDev/ZeaZDev-Omega.git

# 3. Install dependencies
pnpm install

# 4. Setup environment
cp .env.example .env
# Edit .env with your values

# 5. Start Docker services
docker compose up -d

# 6. Run migrations
pnpm db:migrate

# 7. Start development
pnpm dev
```

---

## 📝 Code Style

### General Principles
- **Clean Code**: Self-documenting, readable code
- **DRY**: Don't Repeat Yourself
- **SOLID**: Follow SOLID principles
- **KISS**: Keep It Simple, Stupid
- **Production-Ready**: No placeholders or TODOs in main

### File Headers
All source files must include the ZeaZDev header:

```typescript
// ZeaZDev [File Type] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //
```

### TypeScript/JavaScript

```typescript
// ✅ Good
export interface UserBalance {
  ZEA: string;
  DING: string;
  ETH: string;
}

export const getUserBalance = async (address: string): Promise<UserBalance> => {
  const balance = await fetchBalance(address);
  return balance;
};

// ❌ Bad
export const getBalance = async (addr) => {
  const bal = await fetch(addr);
  return bal;
};
```

**Rules**:
- Use TypeScript strict mode
- Explicit return types
- Descriptive variable names
- No `any` types (use `unknown` if necessary)
- Use async/await over promises
- Handle errors explicitly

### Solidity

```solidity
// ✅ Good
function claimReward(uint256[8] calldata proof, uint256 nullifierHash) 
    external 
    nonReentrant 
{
    if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed();
    _verifyProof(proof, nullifierHash);
    _transferReward(msg.sender);
}

// ❌ Bad
function claim(uint256[8] memory p, uint256 n) public {
    require(!used[n]);
    verify(p, n);
    transfer(msg.sender);
}
```

**Rules**:
- Follow Solidity style guide
- Use custom errors (not `require` strings)
- Explicit visibility modifiers
- natspec comments on public functions
- Reentrancy guards on state-changing functions
- Gas optimization without sacrificing readability

### React/React Native

```tsx
// ✅ Good
interface WalletScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const [balance, setBalance] = useState<string>('0');
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.balance}>{balance} ZEA</Text>
    </View>
  );
};

// ❌ Bad
export default function Wallet(props) {
  const [bal, setBal] = useState('0');
  
  return <View><Text>{bal}</Text></View>;
}
```

**Rules**:
- Functional components with hooks
- TypeScript interfaces for props
- Named exports
- Separate styles with StyleSheet
- Meaningful component names
- Props destructuring

---

## 🧪 Testing

### Test Coverage Requirements
- Smart Contracts: 100% coverage
- Backend API: 80%+ coverage
- Frontend: 60%+ coverage

### Writing Tests

```typescript
// Backend Test Example
describe('AuthController', () => {
  it('should verify World ID proof', async () => {
    const mockProof = {
      proof: '0x...',
      nullifier_hash: 'test_hash',
      signal: '0x1234...',
    };
    
    const result = await controller.verifyWorldId(mockProof);
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
});
```

```solidity
// Smart Contract Test Example
describe("ZeaZRewards", function () {
  it("Should prevent double-claiming", async function () {
    const proof = generateProof();
    const nullifier = generateNullifier();
    
    await rewards.claimDailyCheckIn(proof, nullifier);
    
    await expect(
      rewards.claimDailyCheckIn(proof, nullifier)
    ).to.be.revertedWithCustomError(
      rewards,
      "NullifierAlreadyUsed"
    );
  });
});
```

---

## 🔄 Pull Request Process

### Before Submitting
1. ✅ Code follows style guidelines
2. ✅ All tests pass
3. ✅ No linting errors
4. ✅ Documentation updated (if applicable)
5. ✅ Commit messages are descriptive
6. ✅ Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process
1. Submit PR with descriptive title and template
2. Wait for automated checks (CI/CD)
3. Address reviewer feedback
4. Get approval from 2+ maintainers
5. Squash and merge

---

## 🏷️ Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good
feat(rewards): add ZKP-gated daily check-in
fix(contracts): prevent reentrancy in claim function
docs(readme): update installation instructions

# Bad
update stuff
fix bug
changes
```

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., macOS 14.0]
- Node: [e.g., 18.17.0]
- Browser: [e.g., Chrome 119]

**Additional context**
Any other relevant information
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
Describe the feature

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

---

## 📦 Package Guidelines

### Adding Dependencies

1. **Check if necessary**: Can existing deps solve this?
2. **Security audit**: Is it well-maintained?
3. **License compatible**: MIT/Apache preferred
4. **Bundle size**: Keep it lean
5. **Add to correct package.json**

```bash
# Add to workspace root
pnpm add -w package-name

# Add to specific app
pnpm add --filter @zeazdev/backend package-name

# Add as dev dependency
pnpm add -D --filter @zeazdev/contracts package-name
```

---

## 🔒 Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email: security@zeazdev.com (if configured)
2. Use GitHub Security Advisories
3. Wait for acknowledgment before disclosure

### Security Best Practices
- Never commit secrets or private keys
- Use environment variables
- Validate all user input
- Sanitize database queries
- Use HTTPS/WSS in production
- Keep dependencies updated
- Regular security audits

### PromptPay Security Considerations
- **QR Code Expiry**: Always set 15-minute expiry on QR codes
- **Transaction Verification**: Always verify payment via webhook AND polling
- **Amount Validation**: Validate amount matches QR code generation
- **Reference Uniqueness**: Use cryptographically secure references
- **Webhook Authentication**: Verify webhook signatures from Thai banks
- **Rate Limiting**: Limit QR generation to prevent abuse
- **Anti-Fraud**: Monitor for suspicious patterns in top-up behavior

---

## 📄 Documentation

### When to Update Docs
- New features added
- API changes
- Configuration changes
- Breaking changes
- Complex implementations

### Documentation Structure
- README.md: Overview and quick start
- ARCHITECTURE.md: System design
- API.md: API documentation (future)
- Each module: Inline code comments

---

## 🎓 Learning Resources

### Required Reading
- [React Native Docs](https://reactnative.dev/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [World ID Docs](https://docs.worldcoin.org/)

### Recommended
- [Effective TypeScript](https://effectivetypescript.com/)
- [Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## ❓ Questions?

- Open a discussion on GitHub
- Join our Discord (if available)
- Email: dev@zeazdev.com (if configured)

---

**Thank you for contributing to ZeaZDev!** 🚀

**Last Updated**: 2025-11-08
**Version**: 1.0.0
