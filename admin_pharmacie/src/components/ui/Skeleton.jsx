import PropTypes from 'prop-types';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => (
  <div aria-hidden="true" className={cn('skeleton-shimmer rounded-[6px]', className)} {...props} />
);

Skeleton.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
