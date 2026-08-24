<?php

/*
 * This file is part of the Kimai time-tracking app.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\Command;

use App\Entity\AccessToken;
use App\Entity\User;
use App\Repository\AccessTokenRepository;
use App\User\UserService;
use App\Validator\ValidationFailedException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'kimai:user:create', description: 'Create a new user')]
final class CreateUserCommand extends AbstractUserCommand
{
    public function __construct(
        private UserService $userService,
        private AccessTokenRepository $accessTokenRepository
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $roles = implode(',', [User::DEFAULT_ROLE, User::ROLE_ADMIN]);

        $this
            ->setHelp('This command allows you to create a new user.')
            ->addArgument('username', InputArgument::REQUIRED, 'A name for the new user (must be unique)')
            ->addArgument('email', InputArgument::REQUIRED, 'Email address of the new user (must be unique)')
            ->addArgument(
                'role',
                InputArgument::OPTIONAL,
                'A comma separated list of user roles, e.g. "' . $roles . '"',
                User::DEFAULT_ROLE
            )
            ->addArgument('password', InputArgument::OPTIONAL, 'Password for the new user (requested if not provided)')
            ->addOption('request-password', null, InputOption::VALUE_NONE, 'The user needs to set a new password during next login')
            ->addOption('api-token', null, InputOption::VALUE_REQUIRED, 'Generate an API token for the new user with the given name (Kiminal has no web login; use this to bootstrap the first user)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $username = $input->getArgument('username');
        $email = $input->getArgument('email');
        $role = $input->getArgument('role');

        if (null !== $input->getArgument('password')) {
            $password = $input->getArgument('password');
        } else {
            $password = $this->askForPassword($input, $output);
        }

        $role = $role ?: User::DEFAULT_ROLE;

        $user = $this->userService->createNewUser();
        $user->setUserIdentifier($username);
        $user->setPlainPassword($password);
        $user->setEmail($email);
        $user->setEnabled(true);
        $user->setRoles(explode(',', $role));

        if ($input->getOption('request-password') === true) {
            $user->setRequiresPasswordReset(true);
        }

        $apiTokenName = $input->getOption('api-token');

        try {
            $this->userService->saveUser($user);

            if (is_string($apiTokenName)) {
                $token = substr(bin2hex(random_bytes(100)), 0, 25);
                $accessToken = new AccessToken($user, $token);
                $accessToken->setName($apiTokenName);
                $this->accessTokenRepository->saveAccessToken($accessToken);
                $io->success(\sprintf('Success! Created user: %s', $username));
                $io->writeln(\sprintf('API token (%s): %s', $apiTokenName, $token));
            } else {
                $io->success(\sprintf('Success! Created user: %s', $username));
            }
        } catch (ValidationFailedException $ex) {
            $this->validationError($ex, $io);

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
